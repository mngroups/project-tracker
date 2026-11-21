"use client";

import { unwrapServerAction } from "@mono/auth";
import { useCan } from "@mono/auth/react";
import { useModalParam } from "@mono/hooks/next";
import { useUploadQueue } from "@mono/hooks/upload";
import { Button, Checkbox, DynamicModal, Skeleton, TableEmptyState } from "@mono/ui";
import { FileUploadDropzone } from "@mono/ui/file-upload";
import { getErrorMessage } from "@mono/utils";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import type { Project } from "@/features/projects/schema";
import { toast } from "@/lib/toast";

import { presignAttachmentAction } from "../actions/attachments.actions";
import {
  useAttachments,
  useCommitAttachments,
  useDeleteAttachment,
  useDownloadAttachment,
} from "../hooks/use-attachments";
import { UPLOAD_ACCEPT, UPLOAD_MAX_MB } from "../schema";
import { AttachmentList } from "./attachment-list";

export const CONFIRM_DELETE_FILE_MODAL = "confirm-delete-file";
const MODES = [CONFIRM_DELETE_FILE_MODAL] as const;

export function FilesTab({ project }: { project: Project }) {
  const canUpload = useCan("project.attachment:upload");
  const canSeeInternal = useCan("project.internal:view");
  const { data, isLoading, isError, refetch } = useAttachments(project.id);
  const commit = useCommitAttachments(project.id);
  const remove = useDeleteAttachment(project.id);
  const download = useDownloadAttachment(project.id);
  const { modal, openModal, closeModal } = useModalParam(MODES);

  const [files, setFiles] = useState<File[]>([]);
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // The queue only carries `uploadId`; the commit also needs the key the presign returned.
  const s3Keys = useRef(new Map<string, string>());

  const queue = useUploadQueue({
    mode: "onSubmit",
    presign: async (file) => {
      const res = unwrapServerAction(
        await presignAttachmentAction({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size,
        })
      );
      s3Keys.current.set(res.uploadId, res.s3_key);
      return res;
    },
  });

  const reset = () => {
    setFiles([]);
    setInternal(false);
    s3Keys.current.clear();
    queue.reset();
  };

  const upload = async () => {
    setSubmitting(true);
    try {
      const uploaded = await queue.uploadAll();
      await commit.mutateAsync(
        uploaded.map((u) => ({
          upload_uuid: u.uploadId,
          s3_key: s3Keys.current.get(u.uploadId) ?? "",
          file_name: u.file.name,
          ...(canSeeInternal ? { is_internal: internal } : {}),
        }))
      );
      reset();
    } catch (error) {
      // The commit hook already toasts its own failure; this covers presign/transfer errors.
      if (!commit.isError) toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const target = data?.find((a) => a.id === modal?.target);
  const busy = submitting || queue.isUploading;

  return (
    <div className="min-w-0 space-y-4">
      {canUpload && (
        <div className="space-y-3">
          <FileUploadDropzone
            multiple
            testId="attachment-dropzone"
            value={files}
            onChange={(next) => {
              setFiles(next);
              queue.sync(next);
            }}
            accept={UPLOAD_ACCEPT}
            maxSizeMB={UPLOAD_MAX_MB}
            helperText={`PDF, gambar, Office, ZIP, TXT/CSV. Maksimal ${UPLOAD_MAX_MB} MB per file.`}
            uploads={queue.items}
            onRetry={queue.retry}
            onCancel={queue.cancel}
          />
          {files.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {canSeeInternal ? (
                <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={internal}
                    onCheckedChange={(v) => setInternal(v === true)}
                    className="size-5"
                  />
                  Internal
                </label>
              ) : (
                <span />
              )}
              <Button className="min-h-10" disabled={busy || queue.hasErrors} onClick={upload}>
                {busy && <Loader2 className="animate-spin" />}
                Unggah
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div data-testid="attachments-skeleton" className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="space-y-3 py-6 text-center">
          <TableEmptyState message="Gagal memuat file" />
          <Button variant="outline" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : data && data.length > 0 ? (
        <AttachmentList
          items={data}
          downloadingId={download.isPending ? download.variables : null}
          onDownload={(id) => download.mutate(id)}
          onDelete={(id) => openModal(CONFIRM_DELETE_FILE_MODAL, id)}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada file</p>
      )}

      <DynamicModal
        open={!!modal}
        onOpenChange={closeModal}
        title="Hapus file?"
        description={`${target?.file_name ?? "File"} akan dihapus.`}
        variant="danger"
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => modal?.target && remove.mutate(modal.target, { onSuccess: closeModal })}
        onCancel={closeModal}
        testId="confirm-delete-file-modal"
      />
    </div>
  );
}
