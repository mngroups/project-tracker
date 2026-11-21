import { cn } from "@mono/utils";
import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/app-config";

/** Full-screen auth backdrop: a bottom sheet card on mobile, a centered card on desktop. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-linear-to-b from-slate-900 to-slate-700 px-4 pt-safe pb-[calc(var(--safe-bottom)+6rem)] md:pb-safe">
      <p className="mb-8 text-2xl font-bold tracking-wide text-white">{APP_NAME}</p>
      {children}
    </div>
  );
}

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50 w-full rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl md:relative md:mx-auto md:max-w-sm md:rounded-3xl md:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthCardTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 text-center text-xl font-bold text-gray-900">{children}</h1>;
}
