import "server-only";

import { createAuthFlow, createSession } from "@mono/auth/server";

import { APP_COOKIE_PREFIX, COOKIES, getAuthMode } from "./app-config";

// The app's one session stack (cookie tokens → deduped refresh → auto-logout →
// apiClient), built by @mono/auth from this app's cookie names and BE URL.
//
// Deliberately NOT a "use server" module: every export of one becomes a Server
// Action callable from the browser, and these functions handle raw tokens.
// Server Actions in features/<domain>/actions/ import from here.
const session = createSession({
  apiBaseUrl: process.env.API_BASE_URL,
  cookies: {
    accessToken: COOKIES.accessToken,
    refreshToken: COOKIES.refreshToken,
    extra: [COOKIES.username],
  },
  debug: process.env.API_CLIENT_DEBUG === "true",
});

export const {
  apiClient,
  getAccessToken,
  getRefreshToken,
  hasSession,
  setAuthCookies,
  clearAuthCookies,
  endExpiredSession,
} = session;

// SSO start/callback, logout (central in sso mode) and org switching, on the same
// cookies and token store as the session above.
export const authFlow = createAuthFlow({
  session,
  mode: getAuthMode(),
  cookiePrefix: APP_COOKIE_PREFIX,
});
