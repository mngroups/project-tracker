import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const getExamplesAction = vi.fn();
const createExampleAction = vi.fn();
vi.mock("../../actions/example.actions", () => ({ getExamplesAction, createExampleAction }));

let mobile = false;
vi.mock("@mono/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mono/hooks")>()),
  useIsMobile: () => mobile,
}));
let flag = false;
vi.mock("@/lib/feature-flags/client", () => ({ useFeatureFlag: () => flag }));
const toastInfo = vi.fn();
vi.mock("@/lib/toast", () => ({ toast: { info: toastInfo, success: vi.fn(), error: vi.fn() } }));

const { ExamplePage } = await import("../example-page");

const items = [
  { id: "1", name: "Alpha", status: "active", created_at: "2026-11-16T01:00:00Z" },
  { id: "2", name: "Beta", status: "inactive", created_at: "2026-11-16T02:00:00Z" },
];

describe("ExamplePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobile = false;
    flag = false;
  });

  it("shows a skeleton, then the table", async () => {
    getExamplesAction.mockResolvedValue({ items, total: 2 });
    renderWithProviders(<ExamplePage />);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Nonaktif")).toBeInTheDocument();
    expect(screen.getByText("16 Nov 2026 09:00")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    getExamplesAction.mockResolvedValue({ items: [], total: 0 });
    renderWithProviders(<ExamplePage />);
    expect(await screen.findByText("Belum ada data")).toBeInTheDocument();
  });

  it("falls back to an empty list while the first page has no data", async () => {
    getExamplesAction.mockReturnValue(new Promise(() => {}));
    mobile = true;
    renderWithProviders(<ExamplePage />);
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("renders cards on mobile", async () => {
    mobile = true;
    getExamplesAction.mockResolvedValue({ items, total: 2 });
    renderWithProviders(<ExamplePage />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    // Cards, not the table: no column headers.
    expect(screen.queryByText("Nama")).not.toBeInTheDocument();
  });

  it("hides the export action unless the flag is on", async () => {
    getExamplesAction.mockResolvedValue({ items, total: 2 });
    renderWithProviders(<ExamplePage />);
    expect(screen.queryByTestId("example-export")).not.toBeInTheDocument();
  });

  it("shows the export action behind the flag", async () => {
    flag = true;
    getExamplesAction.mockResolvedValue({ items, total: 2 });
    renderWithProviders(<ExamplePage />);
    fireEvent.click(await screen.findByTestId("example-export"));
    expect(toastInfo).toHaveBeenCalledWith("Ekspor belum tersedia");
  });

  it("opens the create modal through the URL", async () => {
    getExamplesAction.mockResolvedValue({ items, total: 2 });
    renderWithProviders(<ExamplePage />);
    fireEvent.click(await screen.findByTestId("example-add"));
    await waitFor(() => expect(window.location.search).toContain("modal=create-example"));
    expect(await screen.findByText("Tambah Data")).toBeInTheDocument();
  });
});

describe("ExamplePage pagination", () => {
  it("loads the next page", async () => {
    mobile = false;
    flag = false;
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...items[0],
      id: String(i),
      name: `Item ${i}`,
    }));
    getExamplesAction.mockResolvedValue({ items: many, total: 25 });
    renderWithProviders(<ExamplePage />);
    // The desktop pager and its compact twin both render; either one pages.
    fireEvent.click((await screen.findAllByRole("button", { name: "Halaman berikutnya" }))[0]);
    await waitFor(() => expect(getExamplesAction).toHaveBeenCalledWith({ page: 2, page_size: 10 }));
  });
});
