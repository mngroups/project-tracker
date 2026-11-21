import { QueryClient } from "@tanstack/react-query";

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

// A Server Action that redirects (the session-expiry auto-logout) rejects the
// queryFn with a navigation signal, not a failure. Next strips the ApiError
// prototype across the boundary, so match the digest and the message.
export function isNavigationSignal(error: unknown): boolean {
  const e = error as { digest?: unknown; message?: unknown };
  const digest = typeof e?.digest === "string" ? e.digest : "";
  const message = typeof e?.message === "string" ? e.message : "";
  return digest.startsWith("NEXT_REDIRECT") || message.includes("NEXT_REDIRECT");
}

/**
 * Only retry transient failures. 4xx (auth, validation, not-found) fail the same
 * way again. Errors without a status (masked Server Action / network errors) are
 * assumed transient.
 */
export function isRetryableQueryError(error: unknown): boolean {
  if (isNavigationSignal(error)) return false;
  const status = (error as { status?: number })?.status;
  if (typeof status === "number") return status >= 500 || RETRYABLE_STATUSES.has(status);
  return true;
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 5000);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => failureCount < 2 && isRetryableQueryError(error),
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
      },
    },
  });
}
