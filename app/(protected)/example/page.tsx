import type { Metadata } from "next";

import { ExamplePage } from "@/features/example/components/example-page";

export const metadata: Metadata = { title: "Contoh" };

export default function Page() {
  return <ExamplePage />;
}
