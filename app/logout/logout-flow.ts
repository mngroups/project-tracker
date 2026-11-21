import { NEXT_PARAM, sanitizeNextPath, withNextParam } from "@mono/auth";

const SESSION_EXPIRED_REASON = "session_expired";

type SearchParamValue = string | string[] | undefined;

export type LogoutState = {
  reason: string | null;
  nextPath: string | null;
  formAction: string;
  target: string;
};

function firstParam(value: SearchParamValue): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeReason(value: string | null): string | null {
  return value === SESSION_EXPIRED_REASON ? value : null;
}

export function logoutStateFromSearchParams(
  params: URLSearchParams | Record<string, SearchParamValue>
): LogoutState {
  const getParam =
    params instanceof URLSearchParams
      ? (key: string) => params.get(key)
      : (key: string) => firstParam(params[key]);

  const reason = normalizeReason(getParam("reason"));
  const nextPath = sanitizeNextPath(getParam(NEXT_PARAM));
  const reasonQuery = reason ? `?reason=${encodeURIComponent(reason)}` : "";

  return {
    reason,
    nextPath,
    formAction: withNextParam(`/logout/confirm${reasonQuery}`, nextPath),
    target: withNextParam(
      reason ? `/login?reason=${encodeURIComponent(reason)}` : "/login",
      nextPath
    ),
  };
}
