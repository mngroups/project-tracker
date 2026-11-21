import type { RoutePermissions } from "@mono/auth";

/**
 * Route → permissions required to reach it (OR: any one grants access).
 * Routes absent from this map are open to every authenticated user.
 * Single source for the server-side route gate, menu visibility and the
 * post-login landing route. Reference leaf permissions here.
 */
export const ROUTE_PERMISSIONS: RoutePermissions = {
  "/example": ["example.item:view"],
};
