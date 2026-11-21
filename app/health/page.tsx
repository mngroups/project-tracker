import type { Metadata } from "next";

export const metadata: Metadata = { title: "Health Check", robots: { index: false } };

export default function HealthPage() {
  return (
    <div className="flex h-[100dvh] items-center justify-center">
      <p className="font-mono text-lg text-green-600">OK</p>
    </div>
  );
}
