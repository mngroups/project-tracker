import { PermissionsProvider } from "@mono/auth/react";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const listProjectsAction = vi.fn();
const getProjectSummaryAction = vi.fn();
const createProjectAction = vi.fn();
vi.mock("../../actions/projects.actions", () => ({
  listProjectsAction,
  getProjectSummaryAction,
  createProjectAction,
}));

let mobile = false;
vi.mock("@mono/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mono/hooks")>()),
  useIsMobile: () => mobile,
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Radix Select needs these pointer/scroll APIs, which jsdom lacks.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const { ProjectsPage } = await import("../projects-page");

const item = {
  id: "p1",
  code: "PRJ-1",
  name: "Portal Klien dengan Nama yang Sangat Panjang Sekali",
  status: "in_progress",
  health: "at_risk",
  start_date: "2026-01-01",
  target_date: "2026-03-01",
  progress: 45,
  is_overdue: true,
  milestone_count: 4,
  milestone_done_count: 1,
  awaiting_approval_count: 0,
  updated_at: "2026-01-02T00:00:00Z",
};
const summary = {
  total: 1,
  on_track: 0,
  at_risk: 1,
  off_track: 0,
  completed: 0,
  awaiting_approval: 0,
};

function renderPage(permissions: string[] = ["project:view", "project:manage"]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PermissionsProvider permissions={permissions}>{children}</PermissionsProvider>
  );
  return renderWithProviders(wrapper({ children: <ProjectsPage /> }));
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobile = false;
    getProjectSummaryAction.mockResolvedValue(summary);
    listProjectsAction.mockResolvedValue({ items: [item], total: 1 });
  });

  it("shows the skeleton while loading", () => {
    listProjectsAction.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId("project-list-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Belum ada project")).not.toBeInTheDocument();
  });

  it("renders the summary tiles", async () => {
    renderPage();
    const total = await screen.findByTestId("summary-total");
    expect(within(total).getByText("1")).toBeInTheDocument();
  });

  it("renders the table with code, name, health, progress and overdue badge", async () => {
    renderPage();
    expect(await screen.findByText("PRJ-1")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: item.name });
    expect(link).toHaveAttribute("href", "/projects/p1");
    expect(screen.getByText("Berisiko")).toBeInTheDocument();
    expect(screen.getByText("Berjalan")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("1 Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("Terlambat")).toBeInTheDocument();
  });

  it("renders cards on mobile with a wrapping title", async () => {
    mobile = true;
    renderPage();
    const title = await screen.findByText(item.name);
    expect(title).toHaveClass("break-words", "min-w-0");
    expect(title.closest("a")).toHaveAttribute("href", "/projects/p1");
    // Cards, not the table: no column headers.
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    listProjectsAction.mockResolvedValue({ items: [], total: 0 });
    renderPage();
    expect(await screen.findByText("Belum ada project")).toBeInTheDocument();
  });

  it("shows an error state when the list fails", async () => {
    listProjectsAction.mockRejectedValue(new Error("x"));
    renderPage();
    expect(await screen.findByText("Gagal memuat project")).toBeInTheDocument();
  });

  it("reads filters from the URL", async () => {
    window.history.replaceState(null, "", "/?health=off_track&status=on_hold&page=2&search=abc");
    renderPage();
    await waitFor(() =>
      expect(listProjectsAction).toHaveBeenCalledWith({
        page: 2,
        page_size: 10,
        search: "abc",
        status: "on_hold",
        health: "off_track",
      })
    );
  });

  it("ignores an unknown health value in the URL", async () => {
    window.history.replaceState(null, "", "/?health=bogus&page=0");
    renderPage();
    await waitFor(() =>
      expect(listProjectsAction).toHaveBeenCalledWith({ page: 1, page_size: 10 })
    );
  });

  it("changing the health filter updates the URL and refetches", async () => {
    renderPage();
    await screen.findByText("PRJ-1");
    await userEvent.click(screen.getByRole("combobox", { name: /kesehatan/i }));
    await userEvent.click(await screen.findByRole("option", { name: "Bermasalah" }));
    await waitFor(() => expect(window.location.search).toContain("health=off_track"));
    await waitFor(() =>
      expect(listProjectsAction).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 10,
        health: "off_track",
      })
    );
  });

  it("debounces the search into the URL", async () => {
    renderPage();
    await screen.findByText("PRJ-1");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "port" } });
    await waitFor(() => expect(window.location.search).toContain("search=port"), {
      timeout: 2000,
    });
    await waitFor(() =>
      expect(listProjectsAction).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 10,
        search: "port",
      })
    );
  });

  it("follows an external URL change and does not write the stale value back", async () => {
    window.history.replaceState(null, "", "/?search=abc");
    renderPage();
    const input = await screen.findByRole("searchbox");
    expect(input).toHaveValue("abc");
    act(() => window.history.pushState(null, "", "/"));
    await waitFor(() => expect(input).toHaveValue(""));
    await new Promise((r) => setTimeout(r, 450));
    expect(window.location.search).toBe("");
    expect(listProjectsAction).toHaveBeenLastCalledWith({ page: 1, page_size: 10 });
  });

  it("hides Project Baru without project:manage", async () => {
    renderPage(["project:view"]);
    await screen.findByText("PRJ-1");
    expect(screen.queryByRole("button", { name: /project baru/i })).not.toBeInTheDocument();
  });

  it("opens the create modal through the URL and creates a project", async () => {
    createProjectAction.mockResolvedValue({ id: "new" });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /project baru/i }));
    await waitFor(() => expect(window.location.search).toContain("modal=project-form"));
    expect(await screen.findByText("Buat Project")).toBeInTheDocument();
  });
});
