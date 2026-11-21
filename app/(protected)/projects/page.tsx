import type { Metadata } from "next";

import { ProjectsPage } from "@/features/projects/components/projects-page";

export const metadata: Metadata = { title: "Project" };

export default function Page() {
  return <ProjectsPage />;
}
