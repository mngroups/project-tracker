"use client";

import { useCan } from "@mono/auth/react";
import { useModalParam } from "@mono/hooks/next";
import { Button, InfoNote } from "@mono/ui";
import { ClipboardCheck } from "lucide-react";

import type { Project } from "@/features/projects/schema";

import { APPROVAL_MODAL } from "./approval-modal";
import { sortMilestones } from "./milestones-tab";
import type { ProjectTab } from "./project-tabs";

const MODES = [APPROVAL_MODAL] as const;

export const awaitingMilestones = (project: Project) =>
  sortMilestones(project).filter((m) => m.status === "awaiting_approval");

/** Client call-to-action: "{n} milestone menunggu persetujuan Anda". */
export function ApprovalBanner({
  project,
  onShowMilestones,
}: {
  project: Project;
  onShowMilestones: (tab: ProjectTab) => void;
}) {
  const canApprove = useCan("project.milestone:approve");
  const { openModal } = useModalParam(MODES);
  const awaiting = awaitingMilestones(project);
  if (!canApprove || awaiting.length === 0) return null;

  const review = () => {
    onShowMilestones("milestone");
    openModal(APPROVAL_MODAL, awaiting[0].id);
  };

  return (
    <InfoNote
      type="warning"
      data-testid="approval-banner"
      description={
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-2 font-medium break-words">
            <ClipboardCheck className="size-4 shrink-0" />
            {awaiting.length} milestone menunggu persetujuan Anda
          </p>
          <Button className="min-h-10" onClick={review}>
            Tinjau
          </Button>
        </div>
      }
    />
  );
}
