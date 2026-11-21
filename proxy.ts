import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { COOKIES } from "@/lib/app-config";

/**
 * Cheap cookie-based routing only (Next 16 proxy, ex-middleware). Auth itself is
 * enforced by ProtectedPage, and the BE re-checks every request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth =
    Boolean(request.cookies.get(COOKIES.accessToken)?.value) ||
    Boolean(request.cookies.get(COOKIES.refreshToken)?.value);

  // "/" resolves the landing route from permissions in app/page.tsx; the proxy
  // has no permission data, so it only handles the signed-out case.
  if (pathname === "/" && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuth && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Layouts can't read the pathname; the protected layout needs it for the route gate.
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Every route except static assets, API routes and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|health|version).*)"],
};
