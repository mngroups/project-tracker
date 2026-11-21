"use client";

import type { StatusTone } from "@mono/ui";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, StatusLabel } from "@mono/ui";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectProgress } from "@/features/projects/components/project-progress";
import { formatProjectDate } from "@/features/projects/helpers/format-date";
import type { Milestone, Task } from "@/features/projects/schema";

import { TaskRow } from "./task-row";

export const MILESTONE_STATUS_LABEL: Record<Milestone["status"], string> = {
  pending: "Belum mulai",
  in_progress: "Berjalan",
  awaiting_approval: "Menunggu persetujuan",
  approved: "Disetujui",
  changes_requested: "Perlu revisi",
};

export const MILESTONE_STATUS_TONE: Record<Milestone["status"], StatusTone> = {
  pending: "default",
  in_progress: "info",
  awaiting_approval: "warning",
  approved: "success",
  changes_requested: "danger",
};

type MilestoneItemProps = {
  milestone: Milestone;
  /** Slot for manage and approve/decide controls. */
  actions?: ReactNode;
  defaultOpen?: boolean;
  /** Present once the viewer may update tasks: shows each task's checkbox. */
  onToggleTask?: (task: Task) => void;
  /** Trailing controls for one task row. */
  renderTaskActions?: (task: Task) => ReactNode;
};

/** One node of the vertical milestone timeline (rail on the left at every width). */
export function MilestoneItem({
  milestone,
  actions,
  defaultOpen = false,
  onToggleTask,
  renderTaskActions,
}: MilestoneItemProps) {
  const tasks = [...milestone.tasks].sort((a, b) => a.position - b.position);
  return (
    <li
      data-testid="milestone-item"
      data-milestone-id={milestone.id}
      className="relative min-w-0 border-l-2 border-border pb-6 pl-5 last:pb-0"
    >
      <span
        aria-hidden
        className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-background bg-primary"
      />
      <Collapsible defaultOpen={defaultOpen} className="min-w-0 space-y-3">
        <CollapsibleTrigger className="group flex min-h-10 w-full min-w-0 cursor-pointer items-start justify-between gap-2 text-left">
          <span className="min-w-0 space-y-1">
            <span className="block font-medium break-words">{milestone.title}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusLabel tone={MILESTONE_STATUS_TONE[milestone.status]}>
                {MILESTONE_STATUS_LABEL[milestone.status]}
              </StatusLabel>
              {milestone.due_date && <span>{formatProjectDate(milestone.due_date)}</span>}
            </span>
          </span>
          <ChevronDown className="mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <ProjectProgress value={milestone.progress} />
        <CollapsibleContent className="space-y-3">
          {milestone.description && (
            <p className="text-sm break-words text-muted-foreground">{milestone.description}</p>
          )}
          {milestone.decision_note && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="break-words">{milestone.decision_note}</p>
              {milestone.decided_by_name && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {milestone.decided_by_name}
                  {milestone.decided_at
                    ? ` · ${formatProjectDate(milestone.decided_at.slice(0, 10))}`
                    : ""}
                </p>
              )}
            </div>
          )}
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada task</p>
          ) : (
            <ul className="divide-y">
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={onToggleTask}
                  actions={renderTaskActions?.(t)}
                />
              ))}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
      {actions && <div className="mt-3">{actions}</div>}
    </li>
  );
}
