"use client";

import { Button, StatusLabel } from "@mono/ui";
import { formatDecimalIndonesian, formatWitaDateTime } from "@mono/utils";
import { Download, Trash2 } from "lucide-react";

import type { Attachment } from "../schema";

/** `@mono/utils` has no byte formatter, so a small one lives here. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${formatDecimalIndonesian(value, 1)} ${units[i]}`;
}

type Props = {
  items: Attachment[];
  downloadingId?: string | null;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AttachmentList({ items, downloadingId, onDownload, onDelete }: Props) {
  return (
    <ul className="divide-y rounded-xl border" data-testid="attachment-list">
      {items.map((a) => (
        <li key={a.id} className="flex min-w-0 items-start gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 text-sm font-medium break-all">{a.file_name}</span>
              {a.is_internal && <StatusLabel tone="default">Internal</StatusLabel>}
            </div>
            <p className="text-xs break-words text-muted-foreground">
              {formatBytes(a.size)} · {a.uploaded_by_name ?? "-"} ·{" "}
              {formatWitaDateTime(a.created_at, "DD MMM YYYY")}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="outline"
              size="sm"
              className="min-h-10"
              aria-label={`Unduh ${a.file_name}`}
              disabled={downloadingId === a.id}
              onClick={() => onDownload(a.id)}
            >
              <Download />
              <span className="max-sm:sr-only">Unduh</span>
            </Button>
            {a.can_delete && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-10"
                aria-label={`Hapus ${a.file_name}`}
                onClick={() => onDelete(a.id)}
              >
                <Trash2 />
                <span className="max-sm:sr-only">Hapus</span>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
