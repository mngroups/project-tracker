import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const next = vi.fn((init: unknown) => ({ kind: "next", init, headers: new Headers() }));
Object.assign(NextResponse, { next });
vi.mocked(NextResponse.redirect).mockImplementation(
  () => ({ kind: "redirect", headers: new Headers() }) as never
);

const { proxy } = await import("../proxy");

function request(pathname: string, cookies: Record<string, string> = {}) {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: new Headers(),
    cookies: { get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined) },
  } as never;
}

const csp = (res: unknown) => (res as { headers: Headers }).headers.get("content-security-policy");

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends a signed-out visitor from / to /login", () => {
    proxy(request("/"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("http://localhost/login"));
  });

  it("sends a signed-in user away from /login", () => {
    proxy(request("/login", { pt_refresh_token: "r" }));
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("http://localhost/"));
  });

  it("passes the pathname on to the layouts", () => {
    proxy(request("/example", { pt_access_token: "a" }));
    const init = next.mock.calls[0][0] as { request: { headers: Headers } };
    expect(init.request.headers.get("x-pathname")).toBe("/example");
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("lets a signed-out visitor reach /login", () => {
    proxy(request("/login"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it.each(["/auth/start", "/auth/callback"])(
    "lets %s through both signed in and signed out",
    (path) => {
      const out = proxy(request(path));
      const signedIn = proxy(request(path, { pt_refresh_token: "r" }));
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(2);
      expect(csp(out)).toContain("form-action 'self'");
      expect(csp(signedIn)).toContain("form-action 'self'");
    }
  );

  describe("content security policy", () => {
    it("keeps forms on this origin in credentials mode", () => {
      expect(csp(proxy(request("/example", { pt_access_token: "a" })))).toBe(
        "frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'"
      );
    });

    it("lets sso form redirects reach the auth portal (logout → /login → /auth/start → portal)", () => {
      vi.stubEnv("AUTH_MODE", "sso");
      vi.stubEnv("AUTH_PORTAL_URL", "http://localhost:9000/");
      expect(csp(proxy(request("/logout")))).toContain("form-action 'self' http://localhost:9000;");
      // Redirects carry it too.
      expect(csp(proxy(request("/")))).toContain("form-action 'self' http://localhost:9000;");
    });

    it("ignores a portal URL that isn't a valid URL", () => {
      vi.stubEnv("AUTH_MODE", "sso");
      vi.stubEnv("AUTH_PORTAL_URL", "not a url");
      expect(csp(proxy(request("/logout")))).toContain("form-action 'self';");
    });
  });
});
