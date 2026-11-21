import { Skeleton, TableSkeleton } from "@mono/ui";

export function ProjectListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div data-testid="project-list-skeleton">
      <TableSkeleton rows={rows} />
    </div>
  );
}

export function SummaryTilesSkeleton() {
  return (
    <div data-testid="summary-tiles-skeleton" className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
