import { describe, expect, it, vi } from "vitest";

const authFlow = vi.hoisted(() => ({
  logout: vi.fn(async (_opts: { central: boolean }) => ({ endSessionUrl: null as string | null })),
}));
vi.mock("@/lib/session", () => ({ authFlow }));

const { POST } = await import("../route");

function nextRequest(url: string, headers: Record<string, string> = {}) {
  return { nextUrl: new URL(url), headers: new Headers(headers) } as never;
}

describe("/logout/confirm route", () => {
  it("rejects cross-origin requests", async () => {
    const response = await POST(
      nextRequest("http://localhost/logout/confirm", { origin: "https://evil.example" })
    );
    expect(response.status).toBe(403);
  });

  it("clears the session cookies for same-origin requests", async () => {
    const response = (await POST(
      nextRequest("http://localhost/logout/confirm?reason=session_expired&next=%2Fexample", {
        origin: "http://localhost",
      })
    )) as Response & { cookies: { deleted: Array<{ name: string }> } };

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?reason=session_expired&next=%2Fexample");
    expect(response.cookies.deleted.map((item) => item.name)).toEqual([
      "pt_access_token",
      "pt_refresh_token",
      "pt_username",
    ]);
  });

  it("answers 403 even when the guard throws something unexpected", async () => {
    vi.resetModules();
    vi.doMock("@mono/auth/server", () => ({
      assertSameOriginRequest: () => {
        throw new Error("boom");
      },
      guardedJsonError: () => null,
    }));
    const { POST: guardedPost } = await import("../route");
    const response = await guardedPost(nextRequest("http://localhost/logout/confirm"));
    expect(response.status).toBe(403);
    vi.doUnmock("@mono/auth/server");
  });

  it("ends the central session on an explicit logout", async () => {
    authFlow.logout.mockResolvedValueOnce({ endSessionUrl: "https://auth.test/session/end?x=1" });
    const response = await POST(
      nextRequest("http://localhost/logout/confirm", { origin: "http://localhost" })
    );
    expect(authFlow.logout).toHaveBeenLastCalledWith({ central: true });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://auth.test/session/end?x=1");
  });

  it("keeps a session expiry local", async () => {
    await POST(
      nextRequest("http://localhost/logout/confirm?reason=session_expired", {
        origin: "http://localhost",
      })
    );
    expect(authFlow.logout).toHaveBeenLastCalledWith({ central: false });
  });
});
