"use client";

import { ApiError } from "@mono/auth";
import { useCan } from "@mono/auth/react";
import { Button, TableEmptyState } from "@mono/ui";
import Link from "next/link";
import { ProjectFormModal } from "@/features/projects/components/project-form-modal";
import { useProject } from "@/features/projects/hooks/use-projects";
import { MilestonesTab } from "./milestones-tab";
import { OverviewTab } from "./overview-tab";
import { ProjectDetailSkeleton } from "./project-detail-skeleton";
import { ProjectHeader } from "./project-header";
import { ProjectTabs, useProjectTab } from "./project-tabs";

export function ProjectDetailPage({ id }: { id: string }) {
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const [tab, setTab] = useProjectTab();
  const canManage = useCan("project:manage");

  if (isLoading) return <ProjectDetailSkeleton />;

  if (isError || !project) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="space-y-4 py-10 text-center">
          <p className="text-lg font-medium">Project tidak ditemukan</p>
          <Link href="/projects" className="text-sm text-primary hover:underline">
            Kembali ke daftar project
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-4 py-10 text-center">
        <TableEmptyState message="Gagal memuat project" />
        <Button variant="outline" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <ProjectHeader project={project} />
      <ProjectTabs value={tab} onChange={setTab} />
      {tab === "ringkasan" && <OverviewTab project={project} />}
      {tab === "milestone" && <MilestonesTab project={project} />}
      {tab === "file" && (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada file</p>
      )}
      {canManage && <ProjectFormModal mode="edit" project={project} />}
    </div>
  );
}
