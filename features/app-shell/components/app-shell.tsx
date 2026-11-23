"use client";

import { usePermissions } from "@mono/auth/react";
import { type AppShellItem, filterAppShellMenu, AppShell as MonoAppShell } from "@mono/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Org } from "@/features/auth/schema";
import { APP_NAME, COOKIES } from "@/lib/app-config";

import { MENU_ITEMS } from "../constants/menu-items";
import { OrgSwitcher } from "./org-switcher";

export function AppShell({
  children,
  defaultOpen,
  userName,
  org = null,
  orgCount = 0,
}: {
  children: ReactNode;
  defaultOpen: boolean;
  userName: string;
  /** The token's active org; null shows the app name. */
  org?: Org | null;
  orgCount?: number;
}) {
  const pathname = usePathname();
  const { canAccessRoute } = usePermissions();
  const { logout } = useAuth();
  const menu = filterAppShellMenu(MENU_ITEMS, canAccessRoute);
  const bottomNav = menu
    .filter((item): item is AppShellItem => !("children" in item))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <MonoAppShell
      menu={menu}
      bottomNav={bottomNav}
      pathname={pathname}
      linkComponent={Link}
      brand={<OrgSwitcher org={org} orgCount={orgCount} appName={APP_NAME} />}
      user={{ name: userName }}
      onLogout={logout}
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        document.cookie = `${COOKIES.sidebarState}=${open}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      <div className="p-4 pb-[calc(1rem+var(--safe-bottom))] md:p-6">{children}</div>
    </MonoAppShell>
  );
}
