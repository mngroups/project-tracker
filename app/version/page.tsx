import type { Metadata } from "next";

import packageJson from "@/package.json";

export const metadata: Metadata = { title: "Versi", robots: { index: false } };

export default function VersionPage() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <p className="font-mono text-2xl tracking-widest">v{packageJson.version}</p>
    </div>
  );
}
