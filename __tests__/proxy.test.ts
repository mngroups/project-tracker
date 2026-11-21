import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const next = vi.fn((init: unknown) => ({ kind: "next", init }));
Object.assign(NextResponse, { next });

const { proxy } = await import("../proxy");

function request(pathname: string, cookies: Record<string, string> = {}) {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: new Headers(),
    cookies: { get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined) },
  } as never;
}

describe("proxy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a signed-out visitor from / to /login", () => {
    proxy(request("/"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("http://localhost/login"));
  });

  it("sends a signed-in user away from /login", () => {
    proxy(request("/login", { pt_refresh_token: "r" }));
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("http://localhost/"));
  });

  it("passes the pathname on to the layouts", () => {
    proxy(request("/projects", { pt_access_token: "a" }));
    const init = next.mock.calls[0][0] as { request: { headers: Headers } };
    expect(init.request.headers.get("x-pathname")).toBe("/projects");
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("lets a signed-out visitor reach /login", () => {
    proxy(request("/login"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
