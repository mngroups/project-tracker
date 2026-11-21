import { sanitizeNextPath, withNextParam } from "@mono/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { COOKIES } from "@/lib/app-config";

/**
 * Auth gate for every protected route: no refresh-token cookie → /login, carrying
 * the requested page so login can return to it. This is UX only; the BE still
 * authorizes every request.
 */
export default async function ProtectedPage({ children }: { children: ReactNode }) {
  const refreshToken = (await cookies()).get(COOKIES.refreshToken)?.value;

  if (!refreshToken) {
    const pathname = sanitizeNextPath((await headers()).get("x-pathname"));
    redirect(withNextParam("/login", pathname));
  }

  return <>{children}</>;
}
