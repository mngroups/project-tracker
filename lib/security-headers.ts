import { getAuthMode, getAuthPortalUrl } from "./app-config";

/**
 * The page CSP, built per request (not in next.config, which is fixed at build) so one
 * image serves any AUTH_PORTAL_URL. In sso mode `form-action` also allows the auth portal:
 * browsers apply form-action to the redirects after a submit, and the logout forms end at
 * monexa-auth (`/logout/confirm` → end-session URL, or → `/login` → `/auth/start` → portal).
 */
export function contentSecurityPolicy(): string {
  const formAction = ["'self'"];
  const portal = getAuthMode() === "sso" ? getAuthPortalUrl() : null;
  const origin = portal && URL.canParse(portal) ? new URL(portal).origin : null;
  if (origin) formAction.push(origin);
  return [
    "frame-ancestors 'none'",
    `form-action ${formAction.join(" ")}`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
