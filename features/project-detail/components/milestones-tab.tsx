import type { Project } from "@/features/projects/schema";

import { MilestoneItem } from "./milestone-item";

export const sortMilestones = (project: Project) =>
  [...project.milestones].sort((a, b) => a.position - b.position);

/** The first milestone that is not yet approved. */
export const findNextMilestone = (project: Project) =>
  sortMilestones(project).find((m) => m.status !== "approved");

export function MilestonesTab({ project }: { project: Project }) {
  const milestones = sortMilestones(project);
  if (milestones.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada milestone</p>;
  }
  const openId = findNextMilestone(project)?.id;
  return (
    <ol className="min-w-0 pl-1.5">
      {milestones.map((m) => (
        <MilestoneItem key={m.id} milestone={m} defaultOpen={m.id === openId} />
      ))}
    </ol>
  );
}
