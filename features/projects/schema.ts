import { apiEnvelope } from "@mono/auth";
import type { StatusTone } from "@mono/ui";
import { z } from "zod";

export const PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;
export const PROJECT_HEALTHS = ["on_track", "at_risk", "off_track"] as const;

export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export const projectHealthSchema = z.enum(PROJECT_HEALTHS);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectHealth = z.infer<typeof projectHealthSchema>;

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Perencanaan",
  in_progress: "Berjalan",
  on_hold: "Ditunda",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const PROJECT_HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "Sesuai jadwal",
  at_risk: "Berisiko",
  off_track: "Bermasalah",
};

/** `StatusLabel` tone per health value. */
export const HEALTH_TONE: Record<ProjectHealth, StatusTone> = {
  on_track: "success",
  at_risk: "warning",
  off_track: "danger",
};

// Dates travel as `YYYY-MM-DD`.
const dateSchema = z.string().nullable();

export const taskSchema = z.object({
  id: z.string(),
  milestone_id: z.string(),
  title: z.string(),
  status: z.enum(["todo", "in_progress", "done"]),
  assignee_name: z.string().nullable(),
  due_date: dateSchema,
  position: z.number(),
  is_internal: z.boolean(),
});
export type Task = z.infer<typeof taskSchema>;

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  position: z.number(),
  due_date: dateSchema,
  status: z.enum(["pending", "in_progress", "awaiting_approval", "approved", "changes_requested"]),
  progress: z.number(),
  decided_by_name: z.string().nullable(),
  decided_at: z.string().nullable(),
  decision_note: z.string().nullable(),
  tasks: z.array(taskSchema),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const projectListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  status: projectStatusSchema,
  health: projectHealthSchema,
  start_date: dateSchema,
  target_date: dateSchema,
  progress: z.number(),
  is_overdue: z.boolean(),
  milestone_count: z.number(),
  milestone_done_count: z.number(),
  awaiting_approval_count: z.number(),
  updated_at: z.string(),
});
export type ProjectListItem = z.infer<typeof projectListItemSchema>;

export const projectSchema = projectListItemSchema.extend({
  description: z.string(),
  completed_at: z.string().nullable(),
  milestones: z.array(milestoneSchema),
});
export type Project = z.infer<typeof projectSchema>;

export const projectSummarySchema = z.object({
  total: z.number(),
  on_track: z.number(),
  at_risk: z.number(),
  off_track: z.number(),
  completed: z.number(),
  awaiting_approval: z.number(),
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectListResponseSchema = apiEnvelope(
  z.object({ items: z.array(projectListItemSchema), total: z.number() })
);
export type ProjectList = z.infer<typeof projectListResponseSchema>["data"];
export const projectSummaryResponseSchema = apiEnvelope(projectSummarySchema);
export const projectResponseSchema = apiEnvelope(projectSchema);
export const archiveProjectResponseSchema = apiEnvelope(z.null());

export type ProjectListParams = {
  page: number;
  page_size: number;
  search?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
};

const optionalDate = z.union([z.literal(""), z.iso.date()]);

export const projectFormSchema = z
  .object({
    // `.min(1)`: z.string() alone accepts "".
    code: z.string().trim().min(1, "Kode wajib diisi").max(20, "Maksimal 20 karakter"),
    name: z.string().trim().min(1, "Nama wajib diisi").max(150, "Maksimal 150 karakter"),
    description: z.string().trim().max(2000, "Maksimal 2000 karakter"),
    status: projectStatusSchema,
    health: projectHealthSchema,
    // "" means no date; the Server Action sends it as null.
    start_date: optionalDate,
    target_date: optionalDate,
  })
  .refine((v) => !v.start_date || !v.target_date || v.target_date >= v.start_date, {
    message: "Tanggal target harus setelah tanggal mulai",
    path: ["target_date"],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
