import { Checkbox, StatusLabel } from "@mono/ui";

import { formatProjectDate } from "@/features/projects/helpers/format-date";
import type { Task } from "@/features/projects/schema";

export const TASK_STATUS_LABEL: Record<Task["status"], string> = {
  todo: "Belum dikerjakan",
  in_progress: "Dikerjakan",
  done: "Selesai",
};

type TaskRowProps = {
  task: Task;
  /** Present once tasks are editable: renders a checkbox. */
  onToggle?: (task: Task) => void;
};

export function TaskRow({ task, onToggle }: TaskRowProps) {
  return (
    <li className="flex min-w-0 items-start gap-3 py-2" data-testid="task-row">
      {onToggle && (
        <Checkbox
          checked={task.status === "done"}
          onCheckedChange={() => onToggle(task)}
          aria-label={`Tandai ${task.title}`}
          className="mt-0.5"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 text-sm font-medium break-words">{task.title}</span>
          {task.is_internal && <StatusLabel tone="default">Internal</StatusLabel>}
        </div>
        <p className="text-xs break-words text-muted-foreground">
          {TASK_STATUS_LABEL[task.status]}
          {task.assignee_name ? ` · ${task.assignee_name}` : ""}
          {task.due_date ? ` · ${formatProjectDate(task.due_date)}` : ""}
        </p>
      </div>
    </li>
  );
}
