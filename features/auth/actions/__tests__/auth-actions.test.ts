import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
const setAuthCookies = vi.fn();
const clearAuthCookies = vi.fn();
const getAccessToken = vi.fn();
const getRefreshToken = vi.fn();
const cookieSet = vi.fn();
vi.mock("@/lib/session", () => ({
  apiClient,
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ set: cookieSet })) }));

const { loginAction } = await import("../login-action");
const { logoutAction } = await import("../logout-action");
const { getAuthCheckAction } = await import("../auth-check.actions");
const { ApiError } = await import("@mono/auth");

const tokens = { access_token: "a", refresh_token: "r", expires_in: 60, refresh_expires_in: 600 };

describe("loginAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores the tokens and the display username", async () => {
    apiClient.mockResolvedValue({ success: true, message: "ok", code: 200, data: tokens });
    expect(await loginAction({ username: "budi", password: "x" })).toEqual({ success: true });
    expect(setAuthCookies).toHaveBeenCalledWith("a", "r", 60, 600);
    expect(cookieSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: "pt_username", value: "budi", httpOnly: false })
    );
    expect(apiClient.mock.calls[0][1]).toMatchObject({ skipAuthRefresh: true });
  });

  it("returns a failed envelope's message", async () => {
    apiClient.mockResolvedValue({
      success: false,
      message: "Akun terkunci",
      code: 423,
      data: tokens,
    });
    expect(await loginAction({ username: "budi", password: "x" })).toEqual({
      success: false,
      message: "Akun terkunci",
      status: 423,
    });
  });

  it("returns thrown errors with their status", async () => {
    apiClient.mockRejectedValue(new ApiError("Password salah", 401));
    expect(await loginAction({ username: "budi", password: "x" })).toEqual({
      success: false,
      message: "Password salah",
      status: 401,
    });
    apiClient.mockRejectedValue("weird");
    expect(await loginAction({ username: "budi", password: "x" })).toMatchObject({
      success: false,
      status: undefined,
    });
  });
});

describe("logoutAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes the BE session and clears the cookies", async () => {
    getAccessToken.mockResolvedValue("a");
    apiClient.mockResolvedValue({ success: true });
    await logoutAction();
    expect(apiClient).toHaveBeenCalledWith(
      "/v1/auth/logout",
      { method: "POST", skipAuthRefresh: true },
      expect.anything()
    );
    expect(clearAuthCookies).toHaveBeenCalled();
  });

  it("sends the refresh token so the BE can revoke it", async () => {
    getAccessToken.mockResolvedValue("a");
    getRefreshToken.mockResolvedValue("r1");
    apiClient.mockResolvedValue({ success: true });
    await logoutAction();
    expect(apiClient).toHaveBeenCalledWith(
      "/v1/auth/logout",
      { method: "POST", skipAuthRefresh: true, body: JSON.stringify({ refresh_token: "r1" }) },
      expect.anything()
    );
    expect(clearAuthCookies).toHaveBeenCalled();
  });

  it("still revokes the refresh token after the access token has expired", async () => {
    getAccessToken.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue("r2");
    apiClient.mockResolvedValue({ success: true });
    await logoutAction();
    expect(apiClient).toHaveBeenCalledWith(
      "/v1/auth/logout",
      { method: "POST", skipAuthRefresh: true, body: JSON.stringify({ refresh_token: "r2" }) },
      expect.anything()
    );
    expect(clearAuthCookies).toHaveBeenCalled();
  });

  it("still clears the cookies when the BE call fails or there is no token", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    getAccessToken.mockResolvedValue("a");
    apiClient.mockRejectedValue(new Error("down"));
    await logoutAction();
    expect(clearAuthCookies).toHaveBeenCalledTimes(1);

    getAccessToken.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue(undefined);
    await logoutAction();
    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(clearAuthCookies).toHaveBeenCalledTimes(2);
  });
});

describe("getAuthCheckAction", () => {
  it("returns the permissions or throws the envelope error", async () => {
    const data = { user_id: "u", permissions: ["a:view"] };
    apiClient.mockResolvedValue({ success: true, message: "ok", code: 200, data });
    expect(await getAuthCheckAction()).toEqual(data);
    apiClient.mockResolvedValue({ success: false, message: "Ditolak", code: 403, data });
    await expect(getAuthCheckAction()).rejects.toMatchObject({ message: "Ditolak", status: 403 });
  });
});
