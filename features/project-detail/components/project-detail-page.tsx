"use client";

import { ApiError } from "@mono/auth";
import { useCan } from "@mono/auth/react";
import { useModalParam } from "@mono/hooks/next";
import { Button, TableEmptyState } from "@mono/ui";
import Link from "next/link";
import { ProjectFormModal } from "@/features/projects/components/project-form-modal";
import { useProject } from "@/features/projects/hooks/use-projects";
import { ApprovalBanner } from "./approval-banner";
import { APPROVAL_MODAL, ApprovalModal } from "./approval-modal";
import { FilesTab } from "./files-tab";
import { MilestonesTab } from "./milestones-tab";
import { OverviewTab } from "./overview-tab";
import { ProjectDetailSkeleton } from "./project-detail-skeleton";
import { ProjectHeader } from "./project-header";
import { ProjectTabs, useProjectTab } from "./project-tabs";

export function ProjectDetailPage({ id }: { id: string }) {
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const [tab, setTab] = useProjectTab();
  const canManage = useCan("project:manage");
  const canApprove = useCan("project.milestone:approve");
  const { openModal } = useModalParam([APPROVAL_MODAL] as const);

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
      <ApprovalBanner project={project} onShowMilestones={setTab} />
      <ProjectTabs value={tab} onChange={setTab} />
      {tab === "ringkasan" && <OverviewTab project={project} />}
      {tab === "milestone" && (
        <MilestonesTab
          project={project}
          renderMilestoneActions={(m) =>
            canApprove && m.status === "awaiting_approval" ? (
              <Button
                className="min-h-10"
                aria-label={`Tinjau ${m.title}`}
                onClick={() => openModal(APPROVAL_MODAL, m.id)}
              >
                Tinjau
              </Button>
            ) : null
          }
        />
      )}
      {tab === "file" && <FilesTab project={project} />}
      {canApprove && <ApprovalModal project={project} />}
      {canManage && <ProjectFormModal mode="edit" project={project} />}
    </div>
  );
}
