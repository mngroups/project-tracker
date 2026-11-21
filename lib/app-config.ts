// Rename these when you create an app from the template (see README "Use this template").

/** Product name shown in the browser tab and metadata. */
export const APP_NAME = "Monexa App";

/**
 * Prefix of every cookie the app sets. Change it per app so two apps on the same
 * domain never read each other's session.
 */
export const APP_COOKIE_PREFIX = "app";

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
