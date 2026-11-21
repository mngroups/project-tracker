"use client";

import { Can } from "@mono/auth/react";
import { useModalParam } from "@mono/hooks/next";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mono/ui";
import { MoreHorizontal } from "lucide-react";

import type { Milestone } from "@/features/projects/schema";

import { useReorderMilestones, useSubmitMilestone } from "../hooks/use-project-mutations";
import { CONFIRM_DELETE_MODAL } from "./confirm-delete-modal";
import { MILESTONE_FORM_MODAL } from "./milestone-form-modal";
import { newTaskTarget, TASK_FORM_MODAL } from "./task-form-modal";

const MODES = [MILESTONE_FORM_MODAL, TASK_FORM_MODAL, CONFIRM_DELETE_MODAL] as const;

type MilestoneManageMenuProps = {
  projectId: string;
  milestone: Milestone;
  /** All milestone ids in display order. */
  orderedIds: string[];
};

/** PM-only milestone controls. */
export function MilestoneManageMenu({
  projectId,
  milestone,
  orderedIds,
}: MilestoneManageMenuProps) {
  const { openModal } = useModalParam(MODES);
  const reorder = useReorderMilestones(projectId);
  const submit = useSubmitMilestone(projectId);
  const index = orderedIds.indexOf(milestone.id);
  const isFirst = index <= 0;
  const isLast = index === orderedIds.length - 1;
  const canSubmit = milestone.status !== "awaiting_approval" && milestone.status !== "approved";

  const move = (delta: -1 | 1) => {
    const ids = [...orderedIds];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <Can perm="project:manage">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-h-10"
            aria-label={`Kelola ${milestone.title}`}
            data-testid="milestone-manage"
          >
            <MoreHorizontal />
            Kelola
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="min-h-10"
            onSelect={() => openModal(TASK_FORM_MODAL, newTaskTarget(milestone.id))}
          >
            Tambah task
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-10"
            onSelect={() => openModal(MILESTONE_FORM_MODAL, milestone.id)}
          >
            Edit
          </DropdownMenuItem>
          {!isFirst && (
            <DropdownMenuItem className="min-h-10" onSelect={() => move(-1)}>
              Naik
            </DropdownMenuItem>
          )}
          {!isLast && (
            <DropdownMenuItem className="min-h-10" onSelect={() => move(1)}>
              Turun
            </DropdownMenuItem>
          )}
          {canSubmit && (
            <DropdownMenuItem className="min-h-10" onSelect={() => submit.mutate(milestone.id)}>
              Ajukan persetujuan
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-10"
            onSelect={() => openModal(CONFIRM_DELETE_MODAL, `milestone:${milestone.id}`)}
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Can>
  );
}

/** Edit / delete for one task row (PM only). */
export function TaskManageMenu({ taskId, title }: { taskId: string; title: string }) {
  const { openModal } = useModalParam(MODES);
  return (
    <Can perm="project:manage">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            aria-label={`Kelola task ${title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="min-h-10"
            onSelect={() => openModal(TASK_FORM_MODAL, taskId)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="min-h-10"
            onSelect={() => openModal(CONFIRM_DELETE_MODAL, `task:${taskId}`)}
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Can>
  );
}
