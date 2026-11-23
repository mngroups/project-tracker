import { GrowFill, StatusLabel } from "@mono/ui";
import { cn } from "@mono/utils";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";

import { formatProjectDate } from "@/features/projects/helpers/format-date";
import type { Milestone, Project } from "@/features/projects/schema";

import { MILESTONE_STATUS_LABEL, MILESTONE_STATUS_TONE } from "./milestone-item";
import { findNextMilestone, sortMilestones } from "./milestones-tab";

type StepState = "done" | "current" | "upcoming";

function StepIcon({ state }: { state: StepState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        state === "done" && "bg-primary text-primary-foreground",
        state === "current" && "border-2 border-primary bg-background",
        state === "upcoming" && "bg-muted"
      )}
    >
      {state === "done" ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            state === "current" ? "bg-primary" : "bg-muted-foreground/50"
          )}
        />
      )}
    </span>
  );
}

function Step({ milestone, state }: { milestone: Milestone; state: StepState }) {
  return (
    <li
      data-testid="timeline-step"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className="flex min-w-0 items-start gap-3 md:flex-col md:items-center md:gap-2 md:text-center"
    >
      <StepIcon state={state} />
      <div className="min-w-0 space-y-1">
        <p
          className={cn(
            "line-clamp-2 text-sm break-words",
            state === "upcoming" ? "text-muted-foreground" : "font-medium"
          )}
        >
          {milestone.title}
        </p>
        <p className="text-xs text-muted-foreground">{formatProjectDate(milestone.due_date)}</p>
        {state !== "upcoming" && (
          <StatusLabel tone={MILESTONE_STATUS_TONE[milestone.status]}>
            {MILESTONE_STATUS_LABEL[milestone.status]}
          </StatusLabel>
        )}
      </div>
    </li>
  );
}

/** Project progress bar over the milestones in order: approved, the next one, the rest. */
export function DeliveryTimeline({ project }: { project: Project }) {
  const milestones = sortMilestones(project);
  const nextId = findNextMilestone(project)?.id;
  const percent = Math.min(100, Math.max(0, Math.round(project.progress)));
  const stepState = (m: Milestone): StepState =>
    m.status === "approved" ? "done" : m.id === nextId ? "current" : "upcoming";

  return (
    <section
      aria-labelledby="delivery-timeline-title"
      className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 md:p-6"
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h2 id="delivery-timeline-title" className="text-sm font-semibold">
          Timeline pengiriman
        </h2>
        <p className="text-sm text-muted-foreground">
          {project.milestone_done_count} dari {project.milestone_count} milestone disetujui
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres pengiriman"
        className="relative h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <GrowFill pct={percent} className="absolute inset-y-0 left-0 rounded-full bg-primary" />
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada milestone</p>
      ) : (
        <ol
          // Mobile: a vertical list (no sideways scroll at 360px). Desktop: one column per step.
          style={{ "--steps": milestones.length } as CSSProperties}
          className="flex flex-col gap-4 md:grid md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:gap-3"
        >
          {milestones.map((m) => (
            <Step key={m.id} milestone={m} state={stepState(m)} />
          ))}
        </ol>
      )}
    </section>
  );
}
