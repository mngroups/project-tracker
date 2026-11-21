import { readFormDraft } from "@mono/hooks/form-draft";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";
import type { Project } from "../../schema";

const createProjectAction = vi.fn();
const updateProjectAction = vi.fn();
vi.mock("../../actions/projects.actions", () => ({ createProjectAction, updateProjectAction }));
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("@/lib/toast", () => ({ toast }));

const { ProjectFormModal } = await import("../project-form-modal");

const project = {
  id: "p1",
  code: "PRJ-1",
  name: "Alpha",
  description: "Deskripsi",
  status: "on_hold",
  health: "at_risk",
  start_date: "2026-01-01",
  target_date: null,
  progress: 0,
  is_overdue: false,
  milestone_count: 0,
  milestone_done_count: 0,
  awaiting_approval_count: 0,
  updated_at: "2026-01-02T00:00:00Z",
  completed_at: null,
  milestones: [],
} satisfies Project;

describe("ProjectFormModal (create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/?modal=project-form");
  });

  it("submits trimmed values, closes, toasts and clears the draft", async () => {
    createProjectAction.mockResolvedValue({ id: "1" });
    renderWithProviders(<ProjectFormModal mode="create" />);

    const save = await screen.findByRole("button", { name: "Simpan" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Kode"), "  PRJ-9 ");
    await userEvent.type(screen.getByLabelText("Nama"), " Beta  ");
    await waitFor(() => expect(save).toBeEnabled());
    await waitFor(() => expect(readFormDraft("project-form:create")).not.toBeNull());

    fireEvent.click(save);
    await waitFor(() =>
      expect(createProjectAction).toHaveBeenCalledWith({
        code: "PRJ-9",
        name: "Beta",
        description: "",
        status: "planning",
        health: "on_track",
        start_date: "",
        target_date: "",
      })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Project berhasil dibuat"));
    await waitFor(() => expect(window.location.search).not.toContain("modal=project-form"));
    expect(readFormDraft("project-form:create")).toBeNull();
  });

  it("shows a 409 message as a toast as-is and stays open", async () => {
    createProjectAction.mockRejectedValue(new Error("Kode project sudah dipakai"));
    renderWithProviders(<ProjectFormModal mode="create" />);
    await userEvent.type(await screen.findByLabelText("Kode"), "DUP");
    await userEvent.type(screen.getByLabelText("Nama"), "Dup");
    const save = screen.getByRole("button", { name: "Simpan" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Kode project sudah dipakai"));
    expect(window.location.search).toContain("modal=project-form");
  });

  it("blocks a target date before the start date", async () => {
    renderWithProviders(<ProjectFormModal mode="create" />);
    await userEvent.type(await screen.findByLabelText("Kode"), "A");
    await userEvent.type(screen.getByLabelText("Nama"), "B");
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText("Tanggal target"), { target: { value: "2026-04-01" } });
    expect(await screen.findByText("Tanggal target harus setelah tanggal mulai")).toBeVisible();
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
  });

  it("closes on Batal and clears the draft", async () => {
    renderWithProviders(<ProjectFormModal mode="create" />);
    await userEvent.type(await screen.findByLabelText("Kode"), "A");
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    await waitFor(() => expect(window.location.search).not.toContain("modal=project-form"));
    expect(readFormDraft("project-form:create")).toBeNull();
  });
});

describe("ProjectFormModal (edit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/?modal=project-form&target=p1");
  });

  it("prefills from the project and updates it", async () => {
    updateProjectAction.mockResolvedValue(project);
    renderWithProviders(<ProjectFormModal mode="edit" project={project} />);
    expect(await screen.findByText("Edit Project")).toBeInTheDocument();
    expect(screen.getByLabelText("Kode")).toHaveValue("PRJ-1");
    expect(screen.getByLabelText("Tanggal mulai")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Tanggal target")).toHaveValue("");

    await userEvent.type(screen.getByLabelText("Nama"), " 2");
    const save = screen.getByRole("button", { name: "Simpan" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() =>
      expect(updateProjectAction).toHaveBeenCalledWith("p1", {
        code: "PRJ-1",
        name: "Alpha 2",
        description: "Deskripsi",
        status: "on_hold",
        health: "at_risk",
        start_date: "2026-01-01",
        target_date: "",
      })
    );
  });
});
