"use client";

import { ThemeProvider } from "@mono/hooks";
import { Toaster, UiConfigProvider } from "@mono/ui";
import type { ReactNode } from "react";

import { QueryProvider } from "@/lib/query/Provider";

/** Client-side providers mounted once by the root layout. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UiConfigProvider>
          {children}
          <Toaster position="top-center" />
        </UiConfigProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
