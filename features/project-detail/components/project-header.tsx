"use client";

import { useCan } from "@mono/auth/react";
import { useModalToggle } from "@mono/hooks/next";
import { PageHeader, StatusLabel } from "@mono/ui";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { ProjectProgress } from "@/features/projects/components/project-progress";
import {
  HEALTH_TONE,
  PROJECT_HEALTH_LABEL,
  PROJECT_STATUS_LABEL,
  type Project,
} from "@/features/projects/schema";

export function ProjectHeader({ project }: { project: Project }) {
  const canManage = useCan("project:manage");
  const [, setFormOpen] = useModalToggle("project-form", project.id);
  return (
    <div className="min-w-0 space-y-3">
      <PageHeader
        title={project.name}
        subtitle={project.code}
        back={{ href: "/projects", label: "Kembali", testId: "project-back" }}
        linkComponent={Link}
        actions={[
          {
            label: "Edit",
            icon: <Pencil className="size-4" />,
            hidden: !canManage,
            variant: "secondary",
            onClick: () => setFormOpen(true),
            testId: "project-edit",
          },
        ]}
      />
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <StatusLabel tone={HEALTH_TONE[project.health]}>
          {PROJECT_HEALTH_LABEL[project.health]}
        </StatusLabel>
        <StatusLabel tone="default">{PROJECT_STATUS_LABEL[project.status]}</StatusLabel>
        {project.is_overdue && <StatusLabel tone="danger">Terlambat</StatusLabel>}
      </div>
      <ProjectProgress value={project.progress} />
    </div>
  );
}
