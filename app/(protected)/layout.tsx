import { PermissionsProvider } from "@mono/auth/react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { RestrictedPage } from "@/features/app-shell/components/restricted-page";
import ProtectedPage from "@/features/auth/components/protected-page";
import { COOKIES } from "@/lib/app-config";
import { ROUTE_PERMISSIONS } from "@/lib/permissions/routes";
import {
  canAccessRoute,
  getActiveOrg,
  getPermissions,
  resolveLandingRoute,
} from "@/lib/permissions/server";

// Everything behind the session is internal.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Mounts the shell and the route gate once for every protected page; pages
 * stay thin. Permissions are resolved here and passed down as a prop (not a
 * client query) so SSR and hydration agree.
 */
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(COOKIES.sidebarState)?.value !== "false";
  const userName = cookieStore.get(COOKIES.username)?.value || "Pengguna";
  // Set by proxy.ts: layouts can't read the pathname otherwise.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const allowed = !pathname || (await canAccessRoute(pathname));
  const permissions = await getPermissions();
  const hasAnyMenu = (await resolveLandingRoute()) !== null;
  const { org, orgCount } = await getActiveOrg();

  return (
    <PermissionsProvider permissions={permissions} routes={ROUTE_PERMISSIONS}>
      <AppShell defaultOpen={defaultOpen} userName={userName} org={org} orgCount={orgCount}>
        <ProtectedPage>
          {allowed ? children : <RestrictedPage variant={hasAnyMenu ? "route" : "account"} />}
        </ProtectedPage>
      </AppShell>
    </PermissionsProvider>
  );
}
