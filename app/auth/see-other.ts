import { NextResponse } from "next/server";

/**
 * A no-store redirect. A relative Location works behind any proxy without trusting
 * X-Forwarded-*; 303 makes the browser follow with a GET.
 */
export function redirectNoStore(location: string, status: 303 | 307 = 303) {
  return new NextResponse(null, {
    status,
    headers: { Location: location, "Cache-Control": "no-store, must-revalidate" },
  });
}

export function notFound() {
  return new NextResponse(null, { status: 404 });
}
