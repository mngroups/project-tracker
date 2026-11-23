"use client";

import { useModalParam } from "@mono/hooks/next";
import { DynamicModal } from "@mono/ui";

import type { Project } from "@/features/projects/schema";

import { useDeleteMilestone, useDeleteTask } from "../hooks/use-project-mutations";

export const CONFIRM_DELETE_MODAL = "confirm-delete";
const MODES = [CONFIRM_DELETE_MODAL] as const;

/** Confirms deleting a milestone or task; `target` is `milestone:<id>` or `task:<id>`. */
export function ConfirmDeleteModal({ project }: { project: Project }) {
  const { modal, closeModal } = useModalParam(MODES);
  const deleteMilestone = useDeleteMilestone(project.id);
  const deleteTask = useDeleteTask(project.id);
  const [kind, id] = (modal?.target ?? "").split(":");
  const isMilestone = kind === "milestone";
  const mutation = isMilestone ? deleteMilestone : deleteTask;

  const name = isMilestone
    ? project.milestones.find((m) => m.id === id)?.title
    : project.milestones.flatMap((m) => m.tasks).find((t) => t.id === id)?.title;

  return (
    <DynamicModal
      open={!!modal}
      onOpenChange={closeModal}
      title={isMilestone ? "Hapus milestone?" : "Hapus task?"}
      description={
        isMilestone
          ? `${name ?? "Milestone"} beserta semua task di dalamnya akan dihapus.`
          : `${name ?? "Task"} akan dihapus.`
      }
      variant="danger"
      confirmLabel="Hapus"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate(id, { onSuccess: closeModal })}
      testId="confirm-delete-modal"
    />
  );
}
