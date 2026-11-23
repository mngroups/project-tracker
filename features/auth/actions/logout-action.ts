"use server";

import { authFlow } from "@/lib/session";

/**
 * Revokes the refresh token at the BE (best effort) and clears the session
 * cookies. In sso mode it also returns the provider's end-session URL: without
 * visiting it the central session would sign the user straight back in.
 */
export async function logoutAction(): Promise<{ endSessionUrl: string | null }> {
  return authFlow.logout({ central: true });
}
