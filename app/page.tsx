import { redirect } from "next/navigation";

import { RestrictedPage } from "@/features/app-shell/components/restricted-page";
import { resolveLandingRoute } from "@/lib/permissions/server";

// Resolving the landing route reads cookies via /v1/auth/check.
export const dynamic = "force-dynamic";

export default async function Home() {
  const landing = await resolveLandingRoute();
  if (landing) redirect(landing);

  // No menu entry is reachable: render standalone so the user can still log out.
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center pt-safe pb-safe">
      <RestrictedPage variant="account" />
    </main>
  );
}
