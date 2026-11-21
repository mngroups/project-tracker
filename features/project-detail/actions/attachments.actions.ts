"use server";

import {
  ApiError,
  apiEnvelope,
  presignResponseSchema,
  throwIfFail,
  toUploadTarget,
  wrapServerAction,
} from "@mono/auth";
import { apiClient } from "@/lib/session";

import {
  type Attachment,
  type AttachmentCommit,
  attachmentListResponseSchema,
  attachmentResponseSchema,
  downloadResponseSchema,
  emptyResponseSchema,
} from "../schema";

const presignSchema = apiEnvelope(presignResponseSchema);

/** Presigns one upload. `s3_key` rides along: the commit needs it, the queue ignores it. */
export async function presignAttachmentAction(file: {
  filename: string;
  content_type: string;
  size: number;
}) {
  return wrapServerAction(async () => {
    const res = throwIfFail(
      await apiClient(
        "/v1/attachments/presign",
        { method: "POST", body: JSON.stringify(file) },
        presignSchema
      )
    );
    return { ...toUploadTarget(res.data), s3_key: res.data.s3_key ?? "" };
  });
}

export async function listAttachmentsAction(projectId: string): Promise<Attachment[]> {
  const res = await apiClient(
    `/v1/projects/${projectId}/attachments`,
    { method: "GET" },
    attachmentListResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function commitAttachmentAction(
  projectId: string,
  body: AttachmentCommit
): Promise<Attachment> {
  const res = await apiClient(
    `/v1/projects/${projectId}/attachments`,
    { method: "POST", body: JSON.stringify(body) },
    attachmentResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function getDownloadUrlAction(
  projectId: string,
  attachmentId: string
): Promise<string> {
  const res = await apiClient(
    `/v1/projects/${projectId}/attachments/${attachmentId}/download`,
    { method: "GET" },
    downloadResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data.url;
}

export async function deleteAttachmentAction(
  projectId: string,
  attachmentId: string
): Promise<void> {
  const res = await apiClient(
    `/v1/projects/${projectId}/attachments/${attachmentId}`,
    { method: "DELETE" },
    emptyResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
}
