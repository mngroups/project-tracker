import { beforeEach, describe, expect, it, vi } from "vitest";

const authFlow = vi.hoisted(() => ({ mode: "sso", completeSsoLogin: vi.fn() }));
vi.mock("@/lib/session", () => ({ authFlow }));

const { GET } = await import("../route");

function request(url: string) {
  return { nextUrl: new URL(url) } as never;
}

describe("/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authFlow.mode = "sso";
  });

  it("completes the login and continues to the stored path", async () => {
    authFlow.completeSsoLogin.mockResolvedValue({ ok: true, next: "/reports" });
    const response = await GET(request("http://app.test/auth/callback?code=c&state=s"));
    const [arg] = authFlow.completeSsoLogin.mock.calls[0] as [
      { origin: string; searchParams: URLSearchParams },
    ];
    expect(arg.origin).toBe("http://app.test");
    expect(arg.searchParams.get("code")).toBe("c");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/reports");
  });

  it("sends a failed login back to /login with the reason", async () => {
    authFlow.completeSsoLogin.mockResolvedValue({ ok: false, reason: "state_mismatch" });
    const response = await GET(request("http://app.test/auth/callback?code=c&state=x"));
    expect(response.headers.get("location")).toBe("/login?error=state_mismatch");
  });

  it("carries the BE message along with a known refusal", async () => {
    authFlow.completeSsoLogin.mockResolvedValue({
      ok: false,
      reason: "no_app_access",
      message: "Anda tidak memiliki akses & izin",
    });
    const response = await GET(request("http://app.test/auth/callback?code=c&state=s"));
    const location = new URL(response.headers.get("location") as string, "http://app.test");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("no_app_access");
    expect(location.searchParams.get("message")).toBe("Anda tidak memiliki akses & izin");
  });

  it("does not exist in credentials mode", async () => {
    authFlow.mode = "credentials";
    const response = await GET(request("http://app.test/auth/callback?code=c"));
    expect(response.status).toBe(404);
  });
});
