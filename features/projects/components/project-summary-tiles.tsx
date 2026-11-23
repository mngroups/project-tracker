"use client";

import { cn } from "@mono/utils";

import { useProjectSummary } from "../hooks/use-projects";
import type { ProjectSummary } from "../schema";
import { SummaryTilesSkeleton } from "./project-list-skeleton";

const TILES: { key: keyof Omit<ProjectSummary, "completed">; label: string; accent: string }[] = [
  { key: "total", label: "Total", accent: "text-foreground" },
  { key: "on_track", label: "On track", accent: "text-emerald-600 dark:text-emerald-400" },
  { key: "at_risk", label: "At risk", accent: "text-amber-600 dark:text-amber-400" },
  { key: "off_track", label: "Off track", accent: "text-red-600 dark:text-red-400" },
  { key: "awaiting_approval", label: "Menunggu persetujuan", accent: "text-primary" },
];

export function ProjectSummaryTiles() {
  const { data, isLoading } = useProjectSummary();
  if (isLoading) return <SummaryTilesSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {TILES.map(({ key, label, accent }) => (
        <div
          key={key}
          data-testid={`summary-${key}`}
          className="min-w-0 rounded-xl border bg-card p-3 md:p-4"
        >
          <p className="text-xs break-words text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", accent)}>
            {data ? data[key] : "-"}
          </p>
        </div>
      ))}
    </div>
  );
}
