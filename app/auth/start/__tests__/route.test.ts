import { beforeEach, describe, expect, it, vi } from "vitest";

const authFlow = vi.hoisted(() => ({ mode: "sso", beginSsoLogin: vi.fn() }));
vi.mock("@/lib/session", () => ({ authFlow }));

const { GET } = await import("../route");

function request(url: string) {
  return { nextUrl: new URL(url) } as never;
}

describe("/auth/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authFlow.mode = "sso";
  });

  it("starts the SSO login and sends the browser to the provider", async () => {
    authFlow.beginSsoLogin.mockResolvedValue("https://auth.test/authorize?x=1");
    const response = await GET(request("http://app.test/auth/start?next=%2Freports"));
    expect(authFlow.beginSsoLogin).toHaveBeenCalledWith({
      origin: "http://app.test",
      next: "/reports",
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://auth.test/authorize?x=1");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("falls back to the login error card when the provider can't be reached", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    authFlow.beginSsoLogin.mockRejectedValue(new Error("down"));
    const response = await GET(request("http://app.test/auth/start"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=start_failed");
  });

  it("does not exist in credentials mode", async () => {
    authFlow.mode = "credentials";
    const response = await GET(request("http://app.test/auth/start"));
    expect(response.status).toBe(404);
    expect(authFlow.beginSsoLogin).not.toHaveBeenCalled();
  });
});
