import type { Metadata } from "next";

import { ProjectDetailPage } from "@/features/project-detail/components/project-detail-page";

export const metadata: Metadata = { title: "Detail Project" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailPage id={id} />;
}
