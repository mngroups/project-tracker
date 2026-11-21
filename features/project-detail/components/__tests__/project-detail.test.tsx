import { ApiError } from "@mono/auth";
import { PermissionsProvider } from "@mono/auth/react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const getProjectAction = vi.fn();
vi.mock("@/features/projects/actions/projects.actions", () => ({ getProjectAction }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let mobile = false;
vi.mock("@mono/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mono/hooks")>()),
  useIsMobile: () => mobile,
}));

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const { ProjectDetailPage } = await import("../project-detail-page");
const { ProjectDetailSkeleton } = await import("../project-detail-skeleton");
const { MilestoneItem } = await import("../milestone-item");

const task = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  milestone_id: "m1",
  title: "Rancang halaman",
  status: "todo",
  assignee_name: "Budi",
  due_date: "2026-02-01",
  position: 1,
  is_internal: false,
  ...over,
});
const milestone = (over: Record<string, unknown> = {}) => ({
  id: "m1",
  title: "Desain",
  description: "",
  position: 1,
  due_date: "2026-02-01",
  status: "approved",
  progress: 100,
  decided_by_name: null,
  decided_at: null,
  decision_note: null,
  tasks: [],
  ...over,
});
const project = {
  id: "p1",
  code: "PRJ-1",
  name: "Portal Klien dengan Nama yang Sangat Panjang Sekali",
  description: "Portal untuk klien",
  status: "in_progress",
  health: "at_risk",
  start_date: "2026-01-01",
  target_date: "2026-03-01",
  progress: 45,
  is_overdue: true,
  milestone_count: 3,
  milestone_done_count: 1,
  awaiting_approval_count: 0,
  updated_at: "2026-01-02T00:00:00Z",
  completed_at: null,
  milestones: [
    // Out of order on purpose: the UI sorts by `position`.
    milestone({
      id: "m3",
      title: "Peluncuran",
      position: 3,
      status: "pending",
      progress: 0,
    }),
    milestone({ id: "m1", title: "Desain", position: 1 }),
    milestone({
      id: "m2",
      title: "Pengembangan",
      position: 2,
      status: "changes_requested",
      progress: 40,
      decision_note: "Perbaiki alur login",
      decided_by_name: "Sari",
      decided_at: "2026-02-10T00:00:00Z",
      tasks: [task({ id: "t2", title: "Bangun login", is_internal: true })],
    }),
  ],
};

function renderPage(permissions: string[] = ["project:view", "project:manage"]) {
  return renderWithProviders(
    <PermissionsProvider permissions={permissions}>
      <ProjectDetailPage id="p1" />
    </PermissionsProvider>
  );
}

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobile = false;
    getProjectAction.mockResolvedValue(project);
  });

  it("shows the skeleton while loading", () => {
    getProjectAction.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId("project-detail-skeleton")).toBeInTheDocument();
  });

  it("renders the skeleton component", () => {
    renderWithProviders(<ProjectDetailSkeleton />);
    expect(screen.getByTestId("project-detail-skeleton")).toBeInTheDocument();
  });

  it("header shows name, labels, progress and Terlambat", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: project.name })).toBeInTheDocument();
    expect(screen.getByText("Berisiko")).toBeInTheDocument();
    expect(screen.getByText("Berjalan")).toBeInTheDocument();
    expect(screen.getByText("Terlambat")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")[0]).toHaveAttribute("aria-valuenow", "45");
  });

  it("shows Edit only with project:manage and opens the prefilled form", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByDisplayValue(project.name)).toBeInTheDocument();
  });

  it("hides Edit without project:manage", async () => {
    renderPage(["project:view"]);
    await screen.findByRole("heading", { name: project.name });
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("switching tabs writes ?tab=milestone", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Milestone" }));
    expect(window.location.search).toContain("tab=milestone");
    expect(screen.getByRole("tab", { name: "Milestone" })).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to Ringkasan for an unknown tab", async () => {
    window.history.replaceState(null, "", "/?tab=xyz");
    renderPage();
    const tab = await screen.findByRole("tab", { name: "Ringkasan" });
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("overview shows the next open milestone", async () => {
    renderPage();
    await screen.findByRole("heading", { name: project.name });
    const next = screen.getByTestId("next-milestone");
    expect(next).toHaveTextContent("Pengembangan");
    expect(next).toHaveTextContent("Perlu revisi");
  });

  it("milestones render in position order with progress and the decision note", async () => {
    window.history.replaceState(null, "", "/?tab=milestone");
    renderPage();
    await screen.findByRole("heading", { name: project.name });
    const items = screen.getAllByTestId("milestone-item");
    expect(items.map((el) => el.getAttribute("data-milestone-id"))).toEqual(["m1", "m2", "m3"]);
    expect(items[1]).toHaveTextContent("40%");
    expect(items[0]).toHaveTextContent("Disetujui");
    expect(items[2]).toHaveTextContent("Belum mulai");
    // First non-approved (m2) is open by default.
    expect(screen.getByText("Perbaiki alur login")).toBeVisible();
    expect(screen.getByText("Internal")).toBeInTheDocument();
    expect(screen.queryByText("Rancang halaman")).not.toBeInTheDocument();
  });

  it("mobile title has no fixed-width classes", async () => {
    mobile = true;
    renderPage();
    const title = await screen.findByRole("heading", { name: project.name });
    expect(title.className).not.toMatch(/(^|\s)w-\d|\bw-\[|min-w-\[|max-w-\[/);
  });

  it("shows the not-found state on 404", async () => {
    getProjectAction.mockRejectedValue(new ApiError("not found", 404, 404));
    renderPage();
    expect(await screen.findByText("Project tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali/ })).toHaveAttribute("href", "/projects");
  });

  it("shows a generic error on other failures", async () => {
    getProjectAction.mockRejectedValue(new ApiError("boom", 500, 500));
    renderPage();
    await waitFor(() => expect(screen.getByText("Gagal memuat project")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  });
});

describe("MilestoneItem", () => {
  it("renders extra actions", () => {
    renderWithProviders(
      <MilestoneItem milestone={milestone() as never} actions={<span>aksi-x</span>} />
    );
    expect(screen.getByText("aksi-x")).toBeInTheDocument();
  });
});
