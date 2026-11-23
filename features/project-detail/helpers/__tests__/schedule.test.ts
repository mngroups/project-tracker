import { describe, expect, it } from "vitest";

import { daysBetween, scheduleLabel, scheduleState, taskCounts } from "../schedule";

describe("daysBetween", () => {
  it("counts calendar days across a month end", () => {
    expect(daysBetween("2026-01-30", "2026-02-02")).toBe(3);
    expect(daysBetween("2026-02-02", "2026-01-30")).toBe(-3);
  });
});

describe("scheduleState / scheduleLabel", () => {
  const today = "2026-03-10";

  it.each([
    [{ status: "completed", target_date: "2026-01-01" }, "Selesai"],
    [{ status: "cancelled", target_date: "2026-01-01" }, "Dibatalkan"],
    [{ status: "in_progress", target_date: null }, "-"],
    [{ status: "in_progress", target_date: "2026-03-10" }, "Jatuh tempo hari ini"],
    [{ status: "in_progress", target_date: "2026-03-15" }, "5 hari lagi"],
    [{ status: "on_hold", target_date: "2026-03-07" }, "Terlambat 3 hari"],
  ] as const)("%o → %s", (project, label) => {
    expect(scheduleLabel(scheduleState(project, today))).toBe(label);
  });

  it("defaults to today in WITA", () => {
    expect(scheduleState({ status: "in_progress", target_date: "2999-01-01" }).kind).toBe(
      "remaining"
    );
  });
});

describe("taskCounts", () => {
  it("counts done tasks across milestones", () => {
    const t = (status: string) => ({ status }) as never;
    const project = {
      milestones: [{ tasks: [t("done"), t("todo")] }, { tasks: [t("done"), t("in_progress")] }],
    } as never;
    expect(taskCounts(project)).toEqual([2, 4]);
  });
});
