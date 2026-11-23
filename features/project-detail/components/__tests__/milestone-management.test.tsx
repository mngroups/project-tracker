import { PermissionsProvider } from "@mono/auth/react";
import { witaDateString } from "@mono/utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { pickDate } from "@/test-utils/date-picker";
import { renderWithProviders } from "@/test-utils/render";

const getProjectAction = vi.fn();
vi.mock("@/features/projects/actions/projects.actions", () => ({ getProjectAction }));
const milestoneActions = {
  createMilestoneAction: vi.fn(),
  updateMilestoneAction: vi.fn(),
  deleteMilestoneAction: vi.fn(),
  reorderMilestonesAction: vi.fn(),
  submitMilestoneAction: vi.fn(),
  approveMilestoneAction: vi.fn(),
  requestMilestoneChangesAction: vi.fn(),
};
vi.mock("../../actions/milestones.actions", () => milestoneActions);
const taskActions = {
  createTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  setTaskStatusAction: vi.fn(),
};
vi.mock("../../actions/tasks.actions", () => taskActions);
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("@/lib/toast", () => ({ toast }));

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const { ProjectDetailPage } = await import("../project-detail-page");

const task = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  milestone_id: "m1",
  title: "Rancang halaman",
  status: "todo",
  assignee_name: null,
  due_date: null,
  position: 1,
  is_internal: false,
  ...over,
});
const milestone = (over: Record<string, unknown> = {}) => ({
  id: "m1",
  title: "Desain",
  description: "",
  position: 1,
  due_date: null,
  status: "in_progress",
  progress: 0,
  decided_by_name: null,
  decided_at: null,
  decision_note: null,
  tasks: [],
  ...over,
});
const makeProject = (milestones: unknown[]) => ({
  id: "p1",
  code: "PRJ-1",
  name: "Portal",
  description: "",
  status: "in_progress",
  health: "on_track",
  start_date: null,
  target_date: null,
  progress: 0,
  is_overdue: false,
  milestone_count: 3,
  milestone_done_count: 0,
  awaiting_approval_count: 0,
  updated_at: "2026-01-02T00:00:00Z",
  completed_at: null,
  milestones,
});
const standard = () =>
  makeProject([
    milestone({ id: "m1", title: "Desain", position: 1, tasks: [task()] }),
    milestone({ id: "m2", title: "Bangun", position: 2, status: "pending" }),
    milestone({ id: "m3", title: "Rilis", position: 3, status: "pending" }),
  ]);

const PM = ["project:view", "project:manage", "project.task:update", "project.internal:view"];

function renderPage(permissions: string[] = PM) {
  return renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <ProjectDetailPage id="p1" />
    </PermissionsProvider>
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(await screen.findByRole("button", { name: `Kelola ${title}` }));
}

describe("task status toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/?tab=milestone");
    getProjectAction.mockResolvedValue(standard());
  });

  it("updates immediately, calls the action and rolls back with a toast on rejection", async () => {
    let reject: (e: Error) => void = () => {};
    taskActions.setTaskStatusAction.mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      })
    );
    const user = userEvent.setup();
    renderPage();
    const box = await screen.findByRole("checkbox", { name: "Tandai Rancang halaman" });
    expect(box).toHaveAttribute("aria-checked", "false");
    // A refetch must not be what restores the value: only the rollback may.
    getProjectAction.mockReturnValue(new Promise(() => {}));
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    expect(taskActions.setTaskStatusAction).toHaveBeenCalledWith("p1", "t1", "done");
    reject(new Error("gagal"));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(box).toHaveAttribute("aria-checked", "false"));
  });

  it("hides the checkbox for a client", async () => {
    renderPage(["project:view", "project.milestone:approve"]);
    await screen.findByText("Rancang halaman");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("milestone manage menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/?tab=milestone");
    getProjectAction.mockResolvedValue(standard());
    milestoneActions.reorderMilestonesAction.mockResolvedValue(undefined);
    milestoneActions.submitMilestoneAction.mockResolvedValue({});
    milestoneActions.deleteMilestoneAction.mockResolvedValue(undefined);
  });

  it("Naik on the second milestone reorders as [m2, m1, m3]", async () => {
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Bangun");
    await user.click(await screen.findByRole("menuitem", { name: "Naik" }));
    await waitFor(() =>
      expect(milestoneActions.reorderMilestonesAction).toHaveBeenCalledWith("p1", [
        "m2",
        "m1",
        "m3",
      ])
    );
  });

  it("hides Naik on the first and Turun on the last", async () => {
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Desain");
    expect(screen.queryByRole("menuitem", { name: "Naik" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Turun" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await openMenu(user, "Rilis");
    expect(screen.queryByRole("menuitem", { name: "Turun" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Naik" })).toBeInTheDocument();
  });

  it("Ajukan persetujuan calls submitMilestoneAction", async () => {
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Bangun");
    await user.click(await screen.findByRole("menuitem", { name: "Ajukan persetujuan" }));
    await waitFor(() =>
      expect(milestoneActions.submitMilestoneAction).toHaveBeenCalledWith("p1", "m2")
    );
  });

  it.each(["awaiting_approval", "approved"])("hides Ajukan persetujuan when %s", async (status) => {
    getProjectAction.mockResolvedValue(
      makeProject([milestone({ id: "m1", title: "Desain", status })])
    );
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Desain");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Ajukan persetujuan" })).not.toBeInTheDocument();
  });

  it("hides the menu without project:manage", async () => {
    renderPage(["project:view", "project.task:update"]);
    await screen.findByText("Rancang halaman");
    expect(screen.queryByRole("button", { name: /^Kelola/ })).not.toBeInTheDocument();
  });

  it("Hapus asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Bangun");
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByTestId("confirm-delete-modal");
    expect(milestoneActions.deleteMilestoneAction).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Hapus" }));
    await waitFor(() =>
      expect(milestoneActions.deleteMilestoneAction).toHaveBeenCalledWith("p1", "m2")
    );
  });

  it.each(["Batal", "Tutup"])("%s on the delete confirmation goes back only once", async (name) => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();
    await openMenu(user, "Bangun");
    await user.click(await screen.findByRole("menuitem", { name: "Hapus" }));
    const dialog = await screen.findByTestId("confirm-delete-modal");
    await user.click(within(dialog).getByRole("button", { name }));
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });
});

describe("task form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/?tab=milestone");
    getProjectAction.mockResolvedValue(standard());
    taskActions.createTaskAction.mockResolvedValue({});
  });

  async function openTaskForm(user: ReturnType<typeof userEvent.setup>) {
    await openMenu(user, "Bangun");
    await user.click(await screen.findByRole("menuitem", { name: "Tambah task" }));
    return screen.findByTestId("task-form-modal");
  }

  it("requires a title", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openTaskForm(user);
    const title = within(modal).getByLabelText("Judul");
    await user.type(title, "a");
    await user.clear(title);
    expect(await within(modal).findByText("Judul wajib diisi")).toBeInTheDocument();
    expect(within(modal).getByRole("button", { name: "Simpan" })).toBeDisabled();
    expect(taskActions.createTaskAction).not.toHaveBeenCalled();
  });

  it("creates a task for the milestone", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openTaskForm(user);
    await user.type(within(modal).getByLabelText("Judul"), "Tulis tes");
    await user.click(within(modal).getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(taskActions.createTaskAction).toHaveBeenCalledWith(
        "p1",
        "m2",
        expect.objectContaining({ title: "Tulis tes", is_internal: false })
      )
    );
  });

  it("sends the due date picked in the date picker", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openTaskForm(user);
    await user.type(within(modal).getByLabelText("Judul"), "Tulis tes");
    await pickDate(user, "task-due-date", 15);
    expect(screen.getByTestId("task-due-date")).not.toHaveTextContent("Pilih tanggal");
    await user.click(within(modal).getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(taskActions.createTaskAction).toHaveBeenCalledWith(
        "p1",
        "m2",
        expect.objectContaining({ due_date: `${witaDateString().slice(0, 7)}-15` })
      )
    );
  });

  it("shows Internal only with project.internal:view", async () => {
    const user = userEvent.setup();
    const first = renderPage();
    const modal = await openTaskForm(user);
    expect(within(modal).getByText("Internal")).toBeInTheDocument();
    first.unmount();

    window.history.replaceState(null, "", "/?tab=milestone");
    renderPage(["project:view", "project:manage"]);
    const modal2 = await openTaskForm(user);
    expect(within(modal2).queryByText("Internal")).not.toBeInTheDocument();
  });
});
