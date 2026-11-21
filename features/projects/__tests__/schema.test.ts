import { describe, expect, it } from "vitest";

import {
  HEALTH_TONE,
  PROJECT_HEALTH_LABEL,
  PROJECT_STATUS_LABEL,
  projectFormSchema,
  projectSchema,
  projectSummarySchema,
} from "../schema";

const valid = {
  code: "PRJ-1",
  name: "Alpha",
  description: "",
  status: "planning",
  health: "on_track",
  start_date: "2026-01-01",
  target_date: "2026-02-01",
} as const;

describe("projectFormSchema", () => {
  it("accepts a valid form and trims text", () => {
    const parsed = projectFormSchema.parse({ ...valid, code: " PRJ-1 ", name: " Alpha " });
    expect(parsed.code).toBe("PRJ-1");
    expect(parsed.name).toBe("Alpha");
  });

  it("accepts empty dates", () => {
    expect(projectFormSchema.safeParse({ ...valid, start_date: "", target_date: "" }).success).toBe(
      true
    );
  });

  it("rejects a target date before the start date", () => {
    const res = projectFormSchema.safeParse({ ...valid, target_date: "2025-12-31" });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].message).toBe("Tanggal target harus setelah tanggal mulai");
    expect(res.error?.issues[0].path).toEqual(["target_date"]);
  });

  it("rejects blank code and name, and over-long values", () => {
    expect(projectFormSchema.safeParse({ ...valid, code: "  " }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...valid, code: "x".repeat(21) }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...valid, name: "x".repeat(151) }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...valid, description: "x".repeat(2001) }).success).toBe(
      false
    );
  });
});

describe("labels", () => {
  it("has Indonesian labels for every status and health", () => {
    expect(PROJECT_STATUS_LABEL).toEqual({
      planning: "Perencanaan",
      in_progress: "Berjalan",
      on_hold: "Ditunda",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    });
    expect(PROJECT_HEALTH_LABEL).toEqual({
      on_track: "Sesuai jadwal",
      at_risk: "Berisiko",
      off_track: "Bermasalah",
    });
    expect(HEALTH_TONE).toEqual({ on_track: "success", at_risk: "warning", off_track: "danger" });
  });
});

describe("response schemas", () => {
  it("parses a project with milestones and tasks", () => {
    const project = projectSchema.parse({
      id: "1",
      code: "P",
      name: "N",
      status: "planning",
      health: "on_track",
      start_date: null,
      target_date: null,
      progress: 0,
      is_overdue: false,
      milestone_count: 1,
      milestone_done_count: 0,
      awaiting_approval_count: 0,
      updated_at: "2026-01-01T00:00:00Z",
      description: "",
      completed_at: null,
      milestones: [
        {
          id: "m",
          title: "T",
          description: "",
          position: 0,
          due_date: null,
          status: "pending",
          progress: 0,
          decided_by_name: null,
          decided_at: null,
          decision_note: null,
          tasks: [
            {
              id: "t",
              milestone_id: "m",
              title: "x",
              status: "todo",
              assignee_name: null,
              due_date: null,
              position: 0,
              is_internal: false,
            },
          ],
        },
      ],
    });
    expect(project.milestones[0].tasks).toHaveLength(1);
  });

  it("parses the summary", () => {
    const s = {
      total: 1,
      on_track: 1,
      at_risk: 0,
      off_track: 0,
      completed: 0,
      awaiting_approval: 0,
    };
    expect(projectSummarySchema.parse(s)).toEqual(s);
  });
});
