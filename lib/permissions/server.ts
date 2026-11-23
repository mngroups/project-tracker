import "server-only";

import { isRedirectError } from "@mono/auth";
import { createPermissionGate } from "@mono/auth/server";
import { cache } from "react";

import { MENU_ITEMS } from "@/features/app-shell/constants/menu-items";
import { getAuthCheckAction } from "@/features/auth/actions/auth-check.actions";
import type { Org } from "@/features/auth/schema";
import { authFlow, hasSession } from "@/lib/session";

import { ROUTE_PERMISSIONS } from "./routes";

// One GET /v1/auth/check per request, shared by the gate and the org brand.
const getAuthCheck = cache(getAuthCheckAction);

// Server RBAC gate: permissions from GET /v1/auth/check, cached per request,
// failing open when the check is unreachable (the BE still authorizes).
export const { getPermissions, can, canAccessRoute, resolveLandingRoute } = createPermissionGate({
  routes: ROUTE_PERMISSIONS,
  // Menu order is the landing order.
  landingRoutes: MENU_ITEMS.map((item) => item.href),
  hasSession,
  fetchPermissions: async () => (await getAuthCheck()).permissions,
});

export type ActiveOrg = { org: Org | null; orgCount: number };

/** Runs `load`; any failure except a session-expiry redirect yields `fallback`. */
async function orFallback<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return fallback;
  }
}

/**
 * The token's active org and how many orgs the user has, for the shell's brand.
 * The org list is only fetched when there is an org, so single-org users never
 * pay for it twice. Fails soft: the brand falls back to the app name.
 */
export const getActiveOrg = cache(async (): Promise<ActiveOrg> => {
  const none: ActiveOrg = { org: null, orgCount: 0 };
  if (!(await hasSession())) return none;
  const org = await orFallback(async () => (await getAuthCheck()).org ?? null, null);
  if (!org) return none;
  const orgCount = await orFallback(async () => (await authFlow.listOrgs()).length, 1);
  return { org, orgCount };
});
