"use client";

import { getErrorMessage } from "@mono/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";

import {
  commitAttachmentAction,
  deleteAttachmentAction,
  getDownloadUrlAction,
  listAttachmentsAction,
} from "../actions/attachments.actions";
import type { AttachmentCommit } from "../schema";

export const ATTACHMENTS_KEY = (projectId: string) =>
  ["projects", "detail", projectId, "attachments"] as const;

export const useAttachments = (projectId: string) =>
  useQuery({
    queryKey: ATTACHMENTS_KEY(projectId),
    queryFn: () => listAttachmentsAction(projectId),
  });

export function useCommitAttachments(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bodies: AttachmentCommit[]) =>
      Promise.all(bodies.map((b) => commitAttachmentAction(projectId, b))),
    onSuccess: () => {
      toast.success("File diunggah");
      return qc.invalidateQueries({ queryKey: ATTACHMENTS_KEY(projectId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAttachment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttachmentAction(projectId, id),
    onSuccess: () => {
      toast.success("File dihapus");
      return qc.invalidateQueries({ queryKey: ATTACHMENTS_KEY(projectId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Fetches a fresh presigned URL (valid 300 s) and navigates to it; the BE sets `attachment`. */
export function useDownloadAttachment(projectId: string) {
  return useMutation({
    mutationFn: (id: string) => getDownloadUrlAction(projectId, id),
    onSuccess: (url) => window.location.assign(url),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
