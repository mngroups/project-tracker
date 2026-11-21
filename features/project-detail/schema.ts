import { apiEnvelope } from "@mono/auth";
import { z } from "zod";

import { milestoneSchema, taskSchema } from "@/features/projects/schema";

export const milestoneResponseSchema = apiEnvelope(milestoneSchema);
export const taskResponseSchema = apiEnvelope(taskSchema);
export const emptyResponseSchema = apiEnvelope(z.null());

const optionalDate = z.union([z.literal(""), z.iso.date()]);

export const milestoneFormSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(150, "Maksimal 150 karakter"),
  description: z.string().trim().max(2000, "Maksimal 2000 karakter"),
  due_date: optionalDate,
});
export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(200, "Maksimal 200 karakter"),
  assignee_name: z.string().trim().max(100, "Maksimal 100 karakter"),
  due_date: optionalDate,
  is_internal: z.boolean(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const approvalFormSchema = z.object({
  note: z.string().trim().max(1000, "Maksimal 1000 karakter"),
});
export type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

export type TaskStatus = z.infer<typeof taskSchema>["status"];

export const attachmentSchema = z.object({
  id: z.string(),
  milestone_id: z.string().nullable(),
  file_name: z.string(),
  content_type: z.string(),
  size: z.number(),
  uploaded_by_name: z.string().nullable(),
  is_internal: z.boolean(),
  created_at: z.string(),
  can_delete: z.boolean(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const attachmentListResponseSchema = apiEnvelope(z.array(attachmentSchema));
export const attachmentResponseSchema = apiEnvelope(attachmentSchema);
export const downloadResponseSchema = apiEnvelope(
  z.object({ url: z.string(), expires_in: z.number() })
);

/** Mirrors the API's `UPLOAD_ALLOWED_TYPES` (as extensions) and `UPLOAD_MAX_BYTES` (25 MB). */
export const UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.pptx,.zip,.txt,.csv";
export const UPLOAD_MAX_MB = 25;

export type AttachmentCommit = {
  upload_uuid: string;
  s3_key: string;
  file_name: string;
  milestone_id?: string;
  is_internal?: boolean;
};
