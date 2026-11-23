import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/test-utils/test-wrapper";

const actions = {
  listProjectsAction: vi.fn(),
  getProjectSummaryAction: vi.fn(),
  getProjectAction: vi.fn(),
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
  archiveProjectAction: vi.fn(),
};
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("../../actions/projects.actions", () => actions);
vi.mock("@/lib/toast", () => ({ toast }));

const {
  PROJECTS_KEY,
  useArchiveProject,
  useCreateProject,
  useProject,
  useProjectSummary,
  useProjects,
  useUpdateProject,
} = await import("../use-projects");

const values = {
  code: "P",
  name: "N",
  description: "",
  status: "planning",
  health: "on_track",
  start_date: "",
  target_date: "",
} as const;

describe("project queries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists with the given params", async () => {
    actions.listProjectsAction.mockResolvedValue({ items: [], total: 0 });
    const params = { page: 2, page_size: 10, health: "at_risk" } as const;
    const { result } = renderHook(() => useProjects(params), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.data).toEqual({ items: [], total: 0 }));
    expect(actions.listProjectsAction).toHaveBeenCalledWith(params);
  });

  it("fetches the summary", async () => {
    actions.getProjectSummaryAction.mockResolvedValue({ total: 3 });
    const { result } = renderHook(() => useProjectSummary(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.data).toEqual({ total: 3 }));
  });

  it("fetches one project under the detail key", async () => {
    actions.getProjectAction.mockResolvedValue({ id: "abc" });
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useProject("abc"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ id: "abc" }));
    expect(actions.getProjectAction).toHaveBeenCalledWith("abc");
    expect(client.getQueryData([...PROJECTS_KEY, "detail", "abc"])).toEqual({ id: "abc" });
  });
});

describe("project mutations", () => {
  beforeEach(() => vi.clearAllMocks());

  function setup<T>(hook: () => T) {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { ...renderHook(hook, { wrapper }), invalidate };
  }

  it("creates, toasts and invalidates", async () => {
    actions.createProjectAction.mockResolvedValue({ id: "1" });
    const { result, invalidate } = setup(() => useCreateProject());
    act(() => result.current.mutate(values));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Project berhasil dibuat"));
    expect(actions.createProjectAction).toHaveBeenCalledWith(values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PROJECTS_KEY });
  });

  it("toasts the create error as-is", async () => {
    actions.createProjectAction.mockRejectedValue(new Error("Kode project sudah dipakai"));
    const { result } = setup(() => useCreateProject());
    act(() => result.current.mutate(values));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Kode project sudah dipakai"));
  });

  it("updates, toasts and invalidates", async () => {
    actions.updateProjectAction.mockResolvedValue({ id: "1" });
    const { result, invalidate } = setup(() => useUpdateProject("1"));
    act(() => result.current.mutate(values));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Project berhasil diperbarui"));
    expect(actions.updateProjectAction).toHaveBeenCalledWith("1", values);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PROJECTS_KEY });
  });

  it("toasts the update error", async () => {
    actions.updateProjectAction.mockRejectedValue(new Error("Gagal"));
    const { result } = setup(() => useUpdateProject("1"));
    act(() => result.current.mutate(values));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Gagal"));
  });

  it("archives, toasts and invalidates", async () => {
    actions.archiveProjectAction.mockResolvedValue(undefined);
    const { result, invalidate } = setup(() => useArchiveProject());
    act(() => result.current.mutate("1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Project diarsipkan"));
    expect(actions.archiveProjectAction).toHaveBeenCalledWith("1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PROJECTS_KEY });
  });

  it("toasts the archive error", async () => {
    actions.archiveProjectAction.mockRejectedValue(new Error("Gagal"));
    const { result } = setup(() => useArchiveProject());
    act(() => result.current.mutate("1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Gagal"));
  });
});
