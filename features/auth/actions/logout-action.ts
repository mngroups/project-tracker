"use server";

import { apiClient, clearAuthCookies, getAccessToken, getRefreshToken } from "@/lib/session";

import { logoutResponseSchema } from "../schema";

/**
 * Revokes the BE session (best effort) and clears the session cookies. The
 * refresh token goes along so the BE can revoke it at the central auth service.
 * It outlives the access token, so it's sent even after the access token has
 * expired; the logout endpoint needs no bearer. Refreshing just to log out only
 * adds latency, so the call skips the auth refresh.
 */
export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken || (await getAccessToken())) {
    try {
      await apiClient(
        "/v1/auth/logout",
        {
          method: "POST",
          skipAuthRefresh: true,
          ...(refreshToken && { body: JSON.stringify({ refresh_token: refreshToken }) }),
        },
        logoutResponseSchema
      );
    } catch (error) {
      console.warn("Logout API failed:", error);
    }
  }
  await clearAuthCookies();
}
