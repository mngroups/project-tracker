import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
const setAuthCookies = vi.fn();
const clearAuthCookies = vi.fn();
const getAccessToken = vi.fn();
const getRefreshToken = vi.fn();
const authFlow = { logout: vi.fn() };
const cookieSet = vi.fn();
vi.mock("@/lib/session", () => ({
  apiClient,
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  authFlow,
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

  it("passes the BE refusal reason along", async () => {
    apiClient.mockRejectedValue(
      new ApiError("Password harus diganti", 401, undefined, undefined, {
        reason: "password_change_required",
      })
    );
    expect(await loginAction({ username: "budi", password: "x" })).toEqual({
      success: false,
      message: "Password harus diganti",
      status: 401,
      reason: "password_change_required",
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

  it("signs out everywhere and hands back the end-session URL", async () => {
    authFlow.logout.mockResolvedValue({ endSessionUrl: "https://auth.test/end" });
    expect(await logoutAction()).toEqual({ endSessionUrl: "https://auth.test/end" });
    expect(authFlow.logout).toHaveBeenCalledWith({ central: true });
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
