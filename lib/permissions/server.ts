import "server-only";

import { createPermissionGate } from "@mono/auth/server";

import { MENU_ITEMS } from "@/features/app-shell/constants/menu-items";
import { getAuthCheckAction } from "@/features/auth/actions/auth-check.actions";
import { hasSession } from "@/lib/session";

import { ROUTE_PERMISSIONS } from "./routes";

// Server RBAC gate: permissions from GET /v1/auth/check, cached per request,
// failing open when the check is unreachable (the BE still authorizes).
export const { getPermissions, can, canAccessRoute, resolveLandingRoute } = createPermissionGate({
  routes: ROUTE_PERMISSIONS,
  // Menu order is the landing order.
  landingRoutes: MENU_ITEMS.map((item) => item.href),
  hasSession,
  fetchPermissions: async () => (await getAuthCheckAction()).permissions,
});
