"use client";

import { Can, useCan } from "@mono/auth/react";
import { useModalParam } from "@mono/hooks/next";
import { Button } from "@mono/ui";
import { Plus } from "lucide-react";

import type { Milestone, Project, Task } from "@/features/projects/schema";

import { useSetTaskStatus } from "../hooks/use-project-mutations";
import { ConfirmDeleteModal } from "./confirm-delete-modal";
import { MILESTONE_FORM_MODAL, MilestoneFormModal, NEW_TARGET } from "./milestone-form-modal";
import { MilestoneItem } from "./milestone-item";
import { MilestoneManageMenu, TaskManageMenu } from "./milestone-manage-menu";
import { TaskFormModal } from "./task-form-modal";

export const sortMilestones = (project: Project) =>
  [...project.milestones].sort((a, b) => a.position - b.position);

/** The first milestone that is not yet approved. */
export const findNextMilestone = (project: Project) =>
  sortMilestones(project).find((m) => m.status !== "approved");

const MODES = [MILESTONE_FORM_MODAL] as const;

export function MilestonesTab({
  project,
  renderMilestoneActions,
}: {
  project: Project;
  /** Extra per-milestone controls (e.g. the client's "Tinjau" button). */
  renderMilestoneActions?: (milestone: Milestone) => React.ReactNode;
}) {
  const milestones = sortMilestones(project);
  const canUpdateTask = useCan("project.task:update");
  const setStatus = useSetTaskStatus(project.id);
  const { openModal } = useModalParam(MODES);
  const openId = findNextMilestone(project)?.id;
  const orderedIds = milestones.map((m) => m.id);

  const toggle = (task: Task) =>
    setStatus.mutate({ taskId: task.id, status: task.status === "done" ? "todo" : "done" });

  return (
    <div className="min-w-0 space-y-4">
      <Can perm="project:manage">
        <Button
          variant="outline"
          className="min-h-10"
          onClick={() => openModal(MILESTONE_FORM_MODAL, NEW_TARGET)}
        >
          <Plus />
          Tambah milestone
        </Button>
      </Can>
      {milestones.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada milestone</p>
      ) : (
        <ol className="min-w-0 pl-1.5">
          {milestones.map((m) => (
            <MilestoneItem
              key={m.id}
              milestone={m}
              defaultOpen={m.id === openId}
              onToggleTask={canUpdateTask ? toggle : undefined}
              renderTaskActions={(t) => <TaskManageMenu taskId={t.id} title={t.title} />}
              actions={
                <div className="flex flex-wrap gap-2">
                  <MilestoneManageMenu
                    projectId={project.id}
                    milestone={m}
                    orderedIds={orderedIds}
                  />
                  {renderMilestoneActions?.(m)}
                </div>
              }
            />
          ))}
        </ol>
      )}
      <MilestoneFormModal project={project} />
      <TaskFormModal project={project} />
      <ConfirmDeleteModal project={project} />
    </div>
  );
}
