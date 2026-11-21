import type { AppShellItem } from "@mono/ui";
import { LayoutList } from "lucide-react";

/**
 * Sidebar entries, top to bottom. The order is also the post-login landing
 * order: "/" sends the user to the first entry they may open (see
 * `resolveLandingRoute`). The same entries appear in the mobile bottom nav.
 * Gate an entry by adding its route to `lib/permissions/routes.ts::ROUTE_PERMISSIONS`.
 */
export const MENU_ITEMS: AppShellItem[] = [{ label: "Contoh", href: "/example", icon: LayoutList }];
