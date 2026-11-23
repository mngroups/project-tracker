// Rename these when you create an app from the template (see README "Use this template").

/** Product name shown in the browser tab and metadata. */
export const APP_NAME = "Project Tracker";

/**
 * Prefix of every cookie the app sets. Change it per app so two apps on the same
 * domain never read each other's session.
 */
export const APP_COOKIE_PREFIX = "pt";

export const COOKIES = {
  /** HttpOnly bearer token sent to the BE. */
  accessToken: `${APP_COOKIE_PREFIX}_access_token`,
  /** HttpOnly token used by refreshAccessToken; its presence is the "logged in" signal. */
  refreshToken: `${APP_COOKIE_PREFIX}_refresh_token`,
  /** Non-HttpOnly display name. Informational only — never trusted for authorization. */
  username: `${APP_COOKIE_PREFIX}_username`,
  /** Sidebar open/closed, read during SSR to avoid a flash. */
  sidebarState: "sidebar_state",
} as const;

/** Every session cookie, cleared together on logout or a rejected refresh. */
export const SESSION_COOKIES = [COOKIES.accessToken, COOKIES.refreshToken, COOKIES.username];

export type AuthMode = "credentials" | "sso";

/**
 * Server-only. `sso` sends sign-in to the central login (monexa-auth); `credentials`
 * keeps the in-app form. Anything else falls back to `credentials`.
 */
export function getAuthMode(): AuthMode {
  return process.env.AUTH_MODE === "sso" ? "sso" : "credentials";
}

/** Server-only. The monexa-auth origin (for the "Ganti password" link), without a trailing slash. */
export function getAuthPortalUrl(): string | null {
  return process.env.AUTH_PORTAL_URL?.replace(/\/+$/, "") || null;
}

/** Server-only. The client org's slug (one deployment = one client); same value as the BE's. */
export function getAuthOrgHint(): string | null {
  return process.env.AUTH_ORG_HINT || null;
}
