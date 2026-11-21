import type { Metadata } from "next";
import { LogoutCard } from "./logout-card";
import { logoutStateFromSearchParams } from "./logout-flow";

export const metadata: Metadata = {
  title: "Keluar",
  robots: { index: false, follow: false },
};

type LogoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const state = logoutStateFromSearchParams(await searchParams);

  return (
    <LogoutCard
      formAction={state.formAction}
      isSessionExpired={state.reason === "session_expired"}
    />
  );
}
