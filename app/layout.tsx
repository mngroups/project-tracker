import { getThemeInitScript } from "@mono/hooks";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/app-config";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint (no light flash for dark-mode users). */}
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
