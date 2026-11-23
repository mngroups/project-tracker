import { PermissionsProvider } from "@mono/auth/react";
import { UiConfigProvider } from "@mono/ui";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("../../actions/tasks.actions", () => ({ setTaskStatusAction: vi.fn() }));
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("@/lib/toast", () => ({ toast }));

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const { ProjectDetailPage } = await import("../project-detail-page");

const milestone = (over: Record<string, unknown>) => ({
  id: "m1",
  title: "Desain",
  description: "",
  position: 1,
  due_date: null,
  status: "approved",
  progress: 100,
  decided_by_name: null,
  decided_at: null,
  decision_note: null,
  tasks: [],
  ...over,
});
const project = (milestones: unknown[]) => ({
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
  milestone_done_count: 1,
  awaiting_approval_count: 2,
  updated_at: "2026-01-02T00:00:00Z",
  completed_at: null,
  milestones,
});
const awaiting = project([
  milestone({ id: "m1", title: "Desain", position: 1 }),
  milestone({ id: "m3", title: "Rilis", position: 3, status: "awaiting_approval" }),
  milestone({ id: "m2", title: "Bangun", position: 2, status: "awaiting_approval" }),
]);

const CLIENT = ["project:view", "project.milestone:approve"];

function renderPage(permissions: string[] = CLIENT) {
  return renderWithProviders(
    <UiConfigProvider mobileNavV2>
      <PermissionsProvider permissions={permissions}>
        <ProjectDetailPage id="p1" />
      </PermissionsProvider>
    </UiConfigProvider>
  );
}

async function openReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Tinjau" }));
  return screen.findByTestId("approval-modal");
}

describe("client approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/");
    getProjectAction.mockResolvedValue(awaiting);
    milestoneActions.approveMilestoneAction.mockResolvedValue({});
    milestoneActions.requestMilestoneChangesAction.mockResolvedValue({});
  });

  it("shows the banner with the count for a client", async () => {
    renderPage();
    expect(await screen.findByText("2 milestone menunggu persetujuan Anda")).toBeInTheDocument();
  });

  it("hides the banner without project.milestone:approve", async () => {
    renderPage(["project:view", "project:manage"]);
    await screen.findByRole("heading", { name: "Portal" });
    expect(screen.queryByTestId("approval-banner")).not.toBeInTheDocument();
  });

  it("hides the banner when nothing awaits approval", async () => {
    getProjectAction.mockResolvedValue(project([milestone({})]));
    renderPage();
    await screen.findByRole("heading", { name: "Portal" });
    expect(screen.queryByTestId("approval-banner")).not.toBeInTheDocument();
  });

  it("Tinjau switches to the milestone tab and opens the first awaiting milestone", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    expect(window.location.search).toContain("tab=milestone");
    expect(window.location.search).toContain("target=m2");
    expect(within(modal).getByText("Bangun")).toBeInTheDocument();
    expect(screen.getByText("Tinjau milestone")).toBeInTheDocument();
  });

  it("Minta revisi with an empty note shows the validation message and makes no call", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    await user.click(within(modal).getByRole("button", { name: "Minta revisi" }));
    expect(await within(modal).findByText("Catatan revisi wajib diisi")).toBeInTheDocument();
    expect(milestoneActions.requestMilestoneChangesAction).not.toHaveBeenCalled();
  });

  it("Minta revisi sends the note", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    await user.type(within(modal).getByLabelText("Catatan"), "Ubah warna");
    await user.click(within(modal).getByRole("button", { name: "Minta revisi" }));
    await waitFor(() =>
      expect(milestoneActions.requestMilestoneChangesAction).toHaveBeenCalledWith("p1", "m2", {
        note: "Ubah warna",
      })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Permintaan revisi dikirim"));
  });

  it("Setujui calls approveMilestoneAction with the note", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    await user.type(within(modal).getByLabelText("Catatan"), "Bagus");
    await user.click(within(modal).getByRole("button", { name: "Setujui" }));
    await waitFor(() =>
      expect(milestoneActions.approveMilestoneAction).toHaveBeenCalledWith("p1", "m2", {
        note: "Bagus",
      })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Milestone disetujui"));
  });

  it("disables both buttons while a decision is pending", async () => {
    milestoneActions.approveMilestoneAction.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    await user.click(within(modal).getByRole("button", { name: "Setujui" }));
    await waitFor(() => {
      expect(within(modal).getByRole("button", { name: "Setujui" })).toBeDisabled();
      expect(within(modal).getByRole("button", { name: "Minta revisi" })).toBeDisabled();
    });
  });

  it("puts the action row inside the sticky form footer", async () => {
    const user = userEvent.setup();
    renderPage();
    const modal = await openReview(user);
    const row = within(modal).getByRole("button", { name: "Setujui" }).parentElement;
    expect(row).toContainElement(within(modal).getByRole("button", { name: "Minta revisi" }));
    expect(row?.className).toContain("max-md:sticky");
  });

  it("disables both buttons when the milestone is not awaiting approval", async () => {
    window.history.replaceState(null, "", "/?tab=milestone&modal=approval&target=m1");
    renderPage();
    const modal = await screen.findByTestId("approval-modal");
    expect(within(modal).getByRole("button", { name: "Setujui" })).toBeDisabled();
    expect(within(modal).getByRole("button", { name: "Minta revisi" })).toBeDisabled();
  });
});
