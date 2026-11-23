import { Skeleton } from "@mono/ui";

export function ProjectDetailSkeleton() {
  return (
    <div data-testid="project-detail-skeleton" className="min-w-0 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
