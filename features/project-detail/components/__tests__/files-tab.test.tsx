import { PermissionsProvider } from "@mono/auth/react";
import { UiConfigProvider } from "@mono/ui";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const attachmentActions = {
  presignAttachmentAction: vi.fn(),
  listAttachmentsAction: vi.fn(),
  commitAttachmentAction: vi.fn(),
  getDownloadUrlAction: vi.fn(),
  deleteAttachmentAction: vi.fn(),
};
vi.mock("../../actions/attachments.actions", () => attachmentActions);
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("@/lib/toast", () => ({ toast }));

// A headless stand-in for the real queue: `uploadAll` presigns each file and resolves it.
const queueReset = vi.fn();
vi.mock("@mono/hooks/upload", async (importActual) => ({
  ...(await importActual<typeof import("@mono/hooks/upload")>()),
  useUploadQueue: (opts: { presign: (f: File) => Promise<{ uploadId: string }> }) => {
    const ref = useRef<File[]>([]);
    return {
      items: {},
      sync: (next: File[]) => {
        ref.current = next;
      },
      uploadAll: async () =>
        Promise.all(
          ref.current.map(async (file) => ({ file, uploadId: (await opts.presign(file)).uploadId }))
        ),
      retry: vi.fn(),
      cancel: vi.fn(),
      reset: queueReset,
      isUploading: false,
      hasErrors: false,
    };
  },
}));

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const { FilesTab } = await import("../files-tab");

const attachment = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  milestone_id: null,
  file_name: "brief.pdf",
  content_type: "application/pdf",
  size: 2048,
  uploaded_by_name: "Sari",
  is_internal: false,
  created_at: "2026-01-02T03:00:00Z",
  can_delete: true,
  ...over,
});

const projectStub = { id: "p1" } as never;

function renderTab(permissions: string[]) {
  return renderWithProviders(
    <UiConfigProvider mobileNavV2>
      <PermissionsProvider permissions={permissions}>
        <FilesTab project={projectStub} />
      </PermissionsProvider>
    </UiConfigProvider>
  );
}

const STAFF = ["project:view", "project.attachment:upload", "project.internal:view"];
const CLIENT = ["project:view", "project.attachment:upload"];

describe("files tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    attachmentActions.listAttachmentsAction.mockResolvedValue([attachment()]);
    attachmentActions.presignAttachmentAction.mockResolvedValue({
      ok: true,
      data: { uploadId: "u1", url: "https://s3/x", s3_key: "uploads/u1/new.pdf" },
    });
    attachmentActions.commitAttachmentAction.mockResolvedValue(attachment());
  });

  it("hides the dropzone without project.attachment:upload", async () => {
    renderTab(["project:view"]);
    await screen.findByText("brief.pdf");
    expect(screen.queryByTestId("attachment-dropzone")).not.toBeInTheDocument();
  });

  it("hides the Internal checkbox for a client", async () => {
    renderTab(CLIENT);
    await screen.findByTestId("attachment-dropzone");
    expect(screen.queryByLabelText("Internal")).not.toBeInTheDocument();
  });

  it("commits a completed upload and refetches the list", async () => {
    const user = userEvent.setup();
    renderTab(STAFF);
    await screen.findByText("brief.pdf");
    await user.upload(
      screen.getByTestId("attachment-dropzone-input"),
      new File(["x"], "new.pdf", { type: "application/pdf" })
    );
    await user.click(screen.getByLabelText("Internal"));
    await user.click(screen.getByRole("button", { name: "Unggah" }));
    await waitFor(() =>
      expect(attachmentActions.commitAttachmentAction).toHaveBeenCalledWith("p1", {
        upload_uuid: "u1",
        s3_key: "uploads/u1/new.pdf",
        file_name: "new.pdf",
        is_internal: true,
      })
    );
    await waitFor(() => expect(attachmentActions.listAttachmentsAction).toHaveBeenCalledTimes(2));
    expect(attachmentActions.presignAttachmentAction).toHaveBeenCalledWith({
      filename: "new.pdf",
      content_type: "application/pdf",
      size: 1,
    });
    expect(queueReset).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("File diunggah");
  });

  it("does not send is_internal for a client", async () => {
    const user = userEvent.setup();
    renderTab(CLIENT);
    await screen.findByText("brief.pdf");
    await user.upload(
      screen.getByTestId("attachment-dropzone-input"),
      new File(["x"], "new.pdf", { type: "application/pdf" })
    );
    await user.click(screen.getByRole("button", { name: "Unggah" }));
    await waitFor(() => expect(attachmentActions.commitAttachmentAction).toHaveBeenCalled());
    expect(attachmentActions.commitAttachmentAction.mock.calls[0][1]).not.toHaveProperty(
      "is_internal"
    );
  });

  it("Unduh fetches a fresh URL and navigates to it", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    attachmentActions.getDownloadUrlAction.mockResolvedValue("https://s3/get?sig=1");
    const user = userEvent.setup();
    renderTab(CLIENT);
    await user.click(await screen.findByRole("button", { name: "Unduh brief.pdf" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://s3/get?sig=1"));
    expect(attachmentActions.getDownloadUrlAction).toHaveBeenCalledWith("p1", "a1");
    vi.unstubAllGlobals();
  });

  it("shows Hapus only when can_delete, and confirms before deleting", async () => {
    attachmentActions.listAttachmentsAction.mockResolvedValue([
      attachment(),
      attachment({ id: "a2", file_name: "lain.pdf", can_delete: false }),
    ]);
    attachmentActions.deleteAttachmentAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTab(STAFF);
    await screen.findByText("lain.pdf");
    expect(screen.getAllByRole("button", { name: /^Hapus / })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Hapus brief.pdf" }));
    expect(attachmentActions.deleteAttachmentAction).not.toHaveBeenCalled();
    const modal = await screen.findByTestId("confirm-delete-file-modal");
    await user.click(within(modal).getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(attachmentActions.deleteAttachmentAction).toHaveBeenCalledWith("p1", "a1")
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("File dihapus"));
  });

  it("wraps a 255-char file name with break-all", async () => {
    const name = `${"a".repeat(251)}.pdf`;
    attachmentActions.listAttachmentsAction.mockResolvedValue([attachment({ file_name: name })]);
    renderTab(CLIENT);
    const el = await screen.findByText(name);
    expect(el.className).toContain("break-all");
    expect(el.className).toContain("min-w-0");
  });

  it("shows size, uploader and the Internal tag", async () => {
    attachmentActions.listAttachmentsAction.mockResolvedValue([attachment({ is_internal: true })]);
    renderTab(STAFF);
    await screen.findByText("brief.pdf");
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
    expect(screen.getByText(/Sari/)).toBeInTheDocument();
    expect(screen.getByText("Internal", { selector: "span" })).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    attachmentActions.listAttachmentsAction.mockResolvedValue([]);
    renderTab(CLIENT);
    expect(await screen.findByText("Belum ada file")).toBeInTheDocument();
  });

  it("shows a skeleton while loading", () => {
    attachmentActions.listAttachmentsAction.mockReturnValue(new Promise(() => {}));
    renderTab(CLIENT);
    expect(screen.getByTestId("attachments-skeleton")).toBeInTheDocument();
  });
});
