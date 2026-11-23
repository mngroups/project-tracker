import { CountUp, StatusLabel } from "@mono/ui";
import { cn, formatWitaDateTime } from "@mono/utils";
import type { ReactNode } from "react";

import { formatProjectDate } from "@/features/projects/helpers/format-date";
import type { Project } from "@/features/projects/schema";

import { scheduleLabel, scheduleState, taskCounts } from "../helpers/schedule";
import { DeliveryTimeline } from "./delivery-timeline";
import { MILESTONE_STATUS_LABEL, MILESTONE_STATUS_TONE } from "./milestone-item";
import { findNextMilestone } from "./milestones-tab";

const TILE = "min-w-0 rounded-2xl border bg-card p-4";
const CAPTION = "text-xs font-medium tracking-wide text-muted-foreground uppercase";

function StatTile({
  label,
  children,
  testId,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className={cn(TILE, "space-y-2")}>
      <p className={CAPTION}>{label}</p>
      {children}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cn(TILE, "space-y-3 md:p-5")}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 text-right font-medium break-words", tone && "text-destructive")}>
        {value}
      </dd>
    </div>
  );
}

export function OverviewTab({ project }: { project: Project }) {
  const next = findNextMilestone(project);
  const [tasksDone, tasksTotal] = taskCounts(project);
  const schedule = scheduleState(project);
  const changesRequested = project.milestones.filter(
    (m) => m.status === "changes_requested"
  ).length;

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Sisa waktu" testId="time-left">
          <p
            className={cn(
              "text-lg font-semibold md:text-xl",
              schedule.kind === "overdue" && "text-destructive"
            )}
          >
            {scheduleLabel(schedule)}
          </p>
          <p className="text-xs text-muted-foreground">
            Target {formatProjectDate(project.target_date)}
          </p>
        </StatTile>

        <StatTile label="Milestone berikutnya" testId="next-milestone">
          {next ? (
            <>
              <p className="line-clamp-2 text-lg font-semibold break-words md:text-xl">
                {next.title}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusLabel tone={MILESTONE_STATUS_TONE[next.status]}>
                  {MILESTONE_STATUS_LABEL[next.status]}
                </StatusLabel>
                {next.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {formatProjectDate(next.due_date)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm font-medium">Semua milestone telah disetujui</p>
          )}
        </StatTile>

        <StatTile label="Progres">
          <p className="text-lg font-semibold tabular-nums md:text-xl">
            <CountUp value={`${Math.round(project.progress)}%`} />
          </p>
          <p className="text-xs text-muted-foreground">
            {project.milestone_done_count} dari {project.milestone_count} milestone
          </p>
        </StatTile>

        <StatTile label="Task selesai" testId="task-count">
          <p className="text-lg font-semibold tabular-nums md:text-xl">
            {tasksDone}/{tasksTotal}
          </p>
          <p className="text-xs text-muted-foreground">
            {tasksTotal === 0 ? "Belum ada task" : `${tasksTotal - tasksDone} masih berjalan`}
          </p>
        </StatTile>
      </div>

      <DeliveryTimeline project={project} />

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Jadwal">
          <dl className="space-y-2" data-testid="schedule">
            <Row label="Mulai" value={formatProjectDate(project.start_date)} />
            <Row label="Target" value={formatProjectDate(project.target_date)} />
            {project.completed_at && (
              <Row
                label="Selesai pada"
                value={formatWitaDateTime(project.completed_at, "D MMM YYYY")}
              />
            )}
            <Row
              label="Diperbarui"
              value={formatWitaDateTime(project.updated_at, "D MMM YYYY, HH:mm")}
            />
          </dl>
        </Panel>

        <Panel title="Persetujuan">
          <dl className="space-y-2" data-testid="approval-summary">
            <Row label="Menunggu persetujuan" value={String(project.awaiting_approval_count)} />
            <Row
              label="Perlu revisi"
              value={String(changesRequested)}
              tone={changesRequested > 0 ? "danger" : undefined}
            />
            <Row
              label="Disetujui"
              value={`${project.milestone_done_count} dari ${project.milestone_count}`}
            />
          </dl>
        </Panel>
      </div>

      {project.description && (
        <Panel title="Deskripsi">
          <p className="text-sm break-words whitespace-pre-line text-muted-foreground">
            {project.description}
          </p>
        </Panel>
      )}
    </div>
  );
}
