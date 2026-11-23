import { witaDateString } from "@mono/utils";

import type { Project } from "@/features/projects/schema";

const DAY_MS = 86_400_000;

/** Whole days from `from` to `to`, both `YYYY-MM-DD` (calendar dates, no timezone shift). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export type ScheduleState =
  | { kind: "done" }
  | { kind: "cancelled" }
  | { kind: "no-target" }
  | { kind: "remaining"; days: number }
  | { kind: "overdue"; days: number };

/** Where the project stands against its target date, as of `today` (WITA). */
export function scheduleState(
  project: Pick<Project, "status" | "target_date">,
  today: string = witaDateString()
): ScheduleState {
  if (project.status === "completed") return { kind: "done" };
  if (project.status === "cancelled") return { kind: "cancelled" };
  if (!project.target_date) return { kind: "no-target" };
  const days = daysBetween(today, project.target_date);
  return days < 0 ? { kind: "overdue", days: -days } : { kind: "remaining", days };
}

export function scheduleLabel(state: ScheduleState): string {
  switch (state.kind) {
    case "done":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "no-target":
      return "-";
    case "overdue":
      return `Terlambat ${state.days} hari`;
    case "remaining":
      return state.days === 0 ? "Jatuh tempo hari ini" : `${state.days} hari lagi`;
  }
}

/** Visible tasks across all milestones: `[done, total]`. */
export function taskCounts(project: Pick<Project, "milestones">): [number, number] {
  const tasks = project.milestones.flatMap((m) => m.tasks);
  return [tasks.filter((t) => t.status === "done").length, tasks.length];
}
