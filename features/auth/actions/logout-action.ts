"use server";

import { apiClient, clearAuthCookies, getAccessToken } from "@/lib/session";

import { logoutResponseSchema } from "../schema";

/**
 * Revokes the BE session (best effort) and clears the session cookies. Without
 * an access token there is nothing to revoke, and refreshing just to log out
 * only adds latency, so the call skips the auth refresh.
 */
export async function logoutAction() {
  if (await getAccessToken()) {
    try {
      await apiClient(
        "/v1/auth/logout",
        { method: "POST", skipAuthRefresh: true },
        logoutResponseSchema
      );
    } catch (error) {
      console.warn("Logout API failed:", error);
    }
  }
  await clearAuthCookies();
}
