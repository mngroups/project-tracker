"use client";

import { cn } from "@mono/utils";
import { createContext, type ReactNode, useContext } from "react";

import { BrandMark } from "./brand-mark";

const LogoContext = createContext<string | null>(null);

/**
 * Full-screen auth backdrop: a bottom sheet card on mobile, a centered card on desktop.
 * `logoUrl` is the client's logo (one deployment = one client), shown at the top of the
 * `AuthCard`; without it, the app name.
 */
export function AuthLayout({
  children,
  logoUrl = null,
}: {
  children: ReactNode;
  logoUrl?: string | null;
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-linear-to-b from-slate-900 to-slate-700 px-4 pt-safe pb-[calc(var(--safe-bottom)+6rem)] md:pb-safe">
      <LogoContext.Provider value={logoUrl}>{children}</LogoContext.Provider>
    </div>
  );
}

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  const logoUrl = useContext(LogoContext);
  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 w-full rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+var(--safe-bottom))] text-card-foreground shadow-2xl md:relative md:mx-auto md:max-w-sm md:rounded-3xl md:p-8",
        className
      )}
    >
      <BrandMark logoUrl={logoUrl} />
      {children}
    </div>
  );
}

export function AuthCardTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 text-center text-xl font-bold">{children}</h1>;
}
