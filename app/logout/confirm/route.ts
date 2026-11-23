import { assertSameOriginRequest, guardedJsonError } from "@mono/auth/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIES } from "@/lib/app-config";
import { authFlow } from "@/lib/session";

import { logoutStateFromSearchParams } from "../logout-flow";

// State-changing logout lives behind POST so a cross-site navigation to /logout
// can only render the confirmation page, never clear cookies by itself.
export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
  } catch (error) {
    return guardedJsonError(error) ?? NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { reason, target } = logoutStateFromSearchParams(request.nextUrl.searchParams);
  // An explicit logout signs out everywhere (sso); an expired session stays local,
  // so the next /login can sign back in silently and other apps keep their session.
  const { endSessionUrl } = await authFlow.logout({ central: reason === null });
  // A relative Location works behind any proxy without trusting X-Forwarded-*.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: endSessionUrl ?? target, "Cache-Control": "no-store, must-revalidate" },
  });
  for (const name of SESSION_COOKIES) response.cookies.delete({ name, path: "/" });
  return response;
}
