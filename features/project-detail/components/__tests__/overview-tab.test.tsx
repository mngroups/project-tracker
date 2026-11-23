import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Milestone, Project, Task } from "@/features/projects/schema";

import { OverviewTab } from "../overview-tab";

const task = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  milestone_id: "m1",
  title: "Task",
  status: "todo",
  assignee_name: null,
  due_date: null,
  position: 1,
  is_internal: false,
  ...over,
});

const milestone = (over: Partial<Milestone> = {}): Milestone => ({
  id: "m1",
  title: "Desain",
  description: "",
  position: 1,
  due_date: "2026-02-01",
  status: "approved",
  progress: 100,
  decided_by_name: null,
  decided_at: null,
  decision_note: null,
  tasks: [],
  ...over,
});

const base: Project = {
  id: "p1",
  code: "PRJ-1",
  name: "Portal",
  description: "Portal untuk klien",
  status: "in_progress",
  health: "on_track",
  start_date: "2026-01-01",
  target_date: "2999-01-01",
  progress: 68,
  is_overdue: false,
  milestone_count: 4,
  milestone_done_count: 2,
  awaiting_approval_count: 1,
  updated_at: "2026-01-02T00:00:00Z",
  completed_at: null,
  milestones: [
    milestone({ id: "m4", title: "Peluncuran", position: 4, status: "pending", progress: 0 }),
    milestone({ id: "m1", title: "Discovery", position: 1, tasks: [task({ status: "done" })] }),
    milestone({ id: "m2", title: "Desain", position: 2 }),
    milestone({
      id: "m3",
      title: "Pengembangan",
      position: 3,
      status: "changes_requested",
      progress: 40,
      tasks: [task({ id: "t2", status: "done" }), task({ id: "t3" })],
    }),
  ],
};

describe("OverviewTab", () => {
  it("shows the stat tiles", () => {
    render(<OverviewTab project={base} />);
    expect(screen.getByTestId("next-milestone")).toHaveTextContent("Pengembangan");
    expect(screen.getByTestId("next-milestone")).toHaveTextContent("Perlu revisi");
    expect(screen.getByTestId("task-count")).toHaveTextContent("2/3");
    expect(screen.getByTestId("task-count")).toHaveTextContent("1 masih berjalan");
    expect(screen.getByTestId("time-left")).toHaveTextContent("hari lagi");
    expect(screen.getByTestId("time-left")).toHaveTextContent("Target 1 Jan 2999");
  });

  it("draws the timeline in position order with done / current / upcoming steps", () => {
    render(<OverviewTab project={base} />);
    const steps = screen.getAllByTestId("timeline-step");
    expect(steps.map((s) => s.textContent?.split(/\d/)[0])).toEqual([
      "Discovery",
      "Desain",
      "Pengembangan",
      "Peluncuran",
    ]);
    expect(steps.map((s) => s.getAttribute("data-state"))).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
    ]);
    expect(steps[2]).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("progressbar", { name: "Progres pengiriman" })).toHaveAttribute(
      "aria-valuenow",
      "68"
    );
    expect(screen.getByText("2 dari 4 milestone disetujui")).toBeInTheDocument();
  });

  it("summarises approvals and the schedule, and shows the description", () => {
    render(<OverviewTab project={base} />);
    const approvals = screen.getByTestId("approval-summary");
    expect(within(approvals).getByText("Menunggu persetujuan").nextSibling).toHaveTextContent("1");
    expect(within(approvals).getByText("Perlu revisi").nextSibling).toHaveClass("text-destructive");
    const schedule = screen.getByTestId("schedule");
    expect(schedule).toHaveTextContent("1 Jan 2026");
    expect(schedule).not.toHaveTextContent("Selesai pada");
    expect(screen.getByText("Portal untuk klien")).toBeInTheDocument();
  });

  it("handles a finished project without milestones, tasks or description", () => {
    render(
      <OverviewTab
        project={{
          ...base,
          status: "completed",
          description: "",
          completed_at: "2026-02-03T04:00:00Z",
          milestones: [],
          milestone_count: 0,
          milestone_done_count: 0,
        }}
      />
    );
    expect(screen.getByTestId("next-milestone")).toHaveTextContent(
      "Semua milestone telah disetujui"
    );
    expect(screen.getByTestId("task-count")).toHaveTextContent("Belum ada task");
    expect(screen.getByTestId("time-left")).toHaveTextContent("Selesai");
    expect(screen.getByText("Belum ada milestone")).toBeInTheDocument();
    expect(screen.getByTestId("schedule")).toHaveTextContent("Selesai pada");
    expect(screen.queryByText("Deskripsi")).not.toBeInTheDocument();
  });

  it("marks an overdue target in red", () => {
    render(<OverviewTab project={{ ...base, target_date: "2000-01-01" }} />);
    expect(screen.getByText(/^Terlambat \d+ hari$/)).toHaveClass("text-destructive");
  });
});
