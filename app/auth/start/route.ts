import { NEXT_PARAM } from "@mono/auth";
import type { NextRequest } from "next/server";
import { authFlow } from "@/lib/session";

import { notFound, redirectNoStore } from "../see-other";

// A route handler, not a page: only handlers can set the PKCE/state cookie.
export async function GET(request: NextRequest) {
  if (authFlow.mode !== "sso") return notFound();
  try {
    const url = await authFlow.beginSsoLogin({
      origin: request.nextUrl.origin,
      next: request.nextUrl.searchParams.get(NEXT_PARAM),
    });
    return redirectNoStore(url, 307);
  } catch (error) {
    console.warn("SSO start failed:", error);
    // The login page shows an error card instead of bouncing back here in a loop.
    return redirectNoStore("/login?error=start_failed");
  }
}
