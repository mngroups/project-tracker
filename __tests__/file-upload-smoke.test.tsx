import { toUploadTarget } from "@mono/auth";
import { useUploadQueue } from "@mono/hooks/upload";
import { FileUploadDropzone } from "@mono/ui/file-upload";
import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

// Proves the upload subpaths resolve in a consumer app (through server.deps.inline)
// and fit together: presign → toUploadTarget → queue → dropzone state.
function Uploader({
  presign,
}: {
  presign: (file: File) => Promise<ReturnType<typeof toUploadTarget>>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const queue = useUploadQueue({ mode: "onSelect", presign, transport: async () => {} });
  return (
    <FileUploadDropzone
      multiple
      testId="lampiran"
      value={files}
      onChange={(next) => {
        setFiles(next);
        queue.sync(next);
      }}
      uploads={queue.items}
      onRetry={queue.retry}
      onCancel={queue.cancel}
    />
  );
}

describe("file upload in a consumer app", () => {
  it("uploads a picked file and shows it as done", async () => {
    const presign = vi.fn(async () =>
      toUploadTarget({ upload_uuid: "u1", presign_url: "https://s3/x", fields: null })
    );
    renderWithProviders(<Uploader presign={presign} />);
    fireEvent.change(screen.getByTestId("lampiran-input"), {
      target: { files: [new File(["abc"], "berita-acara.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByLabelText("Terunggah")).toBeInTheDocument();
    expect(presign).toHaveBeenCalledTimes(1);
  });
});
