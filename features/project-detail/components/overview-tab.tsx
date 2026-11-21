import { StatusLabel } from "@mono/ui";

import { formatProjectDate } from "@/features/projects/helpers/format-date";
import type { Project } from "@/features/projects/schema";

import { MILESTONE_STATUS_LABEL, MILESTONE_STATUS_TONE } from "./milestone-item";
import { findNextMilestone } from "./milestones-tab";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

export function OverviewTab({ project }: { project: Project }) {
  const next = findNextMilestone(project);
  return (
    <div className="min-w-0 space-y-4">
      {project.description && (
        <p className="text-sm break-words whitespace-pre-line">{project.description}</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Mulai" value={formatProjectDate(project.start_date)} />
        <Stat label="Target" value={formatProjectDate(project.target_date)} />
        <Stat
          label="Milestone selesai"
          value={`${project.milestone_done_count} dari ${project.milestone_count}`}
        />
        <Stat label="Menunggu persetujuan" value={String(project.awaiting_approval_count)} />
      </div>
      <div data-testid="next-milestone" className="min-w-0 rounded-xl border p-4">
        <p className="text-xs text-muted-foreground">Milestone berikutnya</p>
        {next ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="min-w-0 font-medium break-words">{next.title}</span>
            <StatusLabel tone={MILESTONE_STATUS_TONE[next.status]}>
              {MILESTONE_STATUS_LABEL[next.status]}
            </StatusLabel>
            {next.due_date && (
              <span className="text-xs text-muted-foreground">
                {formatProjectDate(next.due_date)}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm">Semua milestone telah disetujui</p>
        )}
      </div>
    </div>
  );
}
