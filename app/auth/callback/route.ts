import type { NextRequest } from "next/server";
import { authFlow } from "@/lib/session";

import { notFound, redirectNoStore } from "../see-other";

export async function GET(request: NextRequest) {
  if (authFlow.mode !== "sso") return notFound();
  const result = await authFlow.completeSsoLogin({
    origin: request.nextUrl.origin,
    searchParams: request.nextUrl.searchParams,
  });
  if (result.ok) return redirectNoStore(result.next);

  const query = new URLSearchParams({ error: result.reason });
  if (result.message) query.set("message", result.message);
  return redirectNoStore(`/login?${query}`);
}
