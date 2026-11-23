import { Button } from "@mono/ui";

import { AuthCard, AuthCardTitle, AuthLayout } from "./auth-card";

export const SSO_GENERIC_ERROR =
  "Proses masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.";

// Refusals whose BE message is worth showing. Anything else (state mismatch, a
// provider error, a hand-made URL) gets the generic copy, so a crafted link can't
// put its own words on the card.
const KNOWN_REASONS = new Set([
  "invalid_credentials",
  "no_app_access",
  "password_change_required",
  "org_not_eligible",
  "google_required",
]);

export function SsoErrorCard({
  reason,
  message,
  passwordChangeUrl,
  logoUrl = null,
}: {
  logoUrl?: string | null;
  reason: string;
  message?: string | null;
  passwordChangeUrl?: string | null;
}) {
  const text = KNOWN_REASONS.has(reason) && message ? message : SSO_GENERIC_ERROR;
  return (
    <AuthLayout logoUrl={logoUrl}>
      <AuthCard className="text-center">
        <AuthCardTitle>Gagal masuk</AuthCardTitle>
        <p role="alert" className="mb-6 text-sm leading-6 text-muted-foreground">
          {text}
        </p>
        {reason === "password_change_required" && passwordChangeUrl && (
          <Button asChild variant="outline" className="mb-3 w-full" size="lg">
            <a href={passwordChangeUrl}>Ganti password</a>
          </Button>
        )}
        {/* A plain <a>: next/link could prefetch the start route and spend a login attempt. */}
        <Button asChild className="w-full" size="lg">
          <a href="/auth/start">Coba lagi</a>
        </Button>
      </AuthCard>
    </AuthLayout>
  );
}
