import { ACCOUNT_PASSWORD_PATH, NEXT_PARAM, sanitizeNextPath, withNextParam } from "@mono/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import LoginForm from "@/features/auth/components/login-form";
import { SsoErrorCard } from "@/features/auth/components/sso-error-card";
import { getAuthMode, getAuthOrgHint, getAuthPortalUrl } from "@/lib/app-config";

export const metadata: Metadata = { title: "Masuk" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const portal = getAuthPortalUrl();
  const passwordChangeUrl = portal ? `${portal}${ACCOUNT_PASSWORD_PATH}` : null;
  const hint = getAuthOrgHint();
  // monexa-auth serves each org's login logo publicly; a 404 (no logo) falls back to the name.
  const logoUrl =
    portal && hint ? `${portal}/branding/orgs/${encodeURIComponent(hint)}/logo` : null;

  if (getAuthMode() === "sso") {
    const error = first(params.error);
    if (!error) {
      redirect(withNextParam("/auth/start", sanitizeNextPath(first(params[NEXT_PARAM]))));
    }
    return (
      <SsoErrorCard
        reason={error}
        message={first(params.message)}
        passwordChangeUrl={passwordChangeUrl}
        logoUrl={logoUrl}
      />
    );
  }

  // LoginForm reads ?reason=, so it needs a Suspense boundary to stay prerenderable.
  return (
    <Suspense>
      <LoginForm passwordChangeUrl={passwordChangeUrl} logoUrl={logoUrl} />
    </Suspense>
  );
}
