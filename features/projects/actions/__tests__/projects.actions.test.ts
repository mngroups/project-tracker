import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
vi.mock("@/lib/session", () => ({ apiClient }));

const {
  archiveProjectAction,
  createProjectAction,
  getProjectAction,
  getProjectSummaryAction,
  listProjectsAction,
  updateProjectAction,
} = await import("../projects.actions");

const listItem = {
  id: "1",
  code: "P",
  name: "N",
  status: "planning",
  health: "on_track",
  start_date: null,
  target_date: null,
  progress: 0,
  is_overdue: false,
  milestone_count: 0,
  milestone_done_count: 0,
  awaiting_approval_count: 0,
  updated_at: "2026-01-01T00:00:00Z",
};
const project = { ...listItem, description: "", completed_at: null, milestones: [] };
const ok = (data: unknown, code = 200) => ({ success: true, message: "ok", code, data });
const values = {
  code: "P",
  name: "N",
  description: "",
  status: "planning",
  health: "on_track",
  start_date: "",
  target_date: "2026-03-01",
} as const;

describe("projects actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists with query params", async () => {
    const data = { items: [listItem], total: 1 };
    apiClient.mockResolvedValue(ok(data));
    const params = { page: 2, page_size: 10, search: "a", health: "at_risk" } as const;
    expect(await listProjectsAction(params)).toEqual(data);
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects");
    expect(apiClient.mock.calls[0][1]).toMatchObject({ method: "GET", params });
  });

  it("gets the summary", async () => {
    const data = {
      total: 1,
      on_track: 1,
      at_risk: 0,
      off_track: 0,
      completed: 0,
      awaiting_approval: 0,
    };
    apiClient.mockResolvedValue(ok(data));
    expect(await getProjectSummaryAction()).toEqual(data);
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/summary");
  });

  it("gets one project", async () => {
    apiClient.mockResolvedValue(ok(project));
    expect(await getProjectAction("abc")).toEqual(project);
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/abc");
  });

  it("creates, sending empty dates as null", async () => {
    apiClient.mockResolvedValue(ok(project, 201));
    expect(await createProjectAction(values)).toEqual(project);
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects");
    expect(apiClient.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(apiClient.mock.calls[0][1].body)).toEqual({
      ...values,
      start_date: null,
    });
  });

  it("updates with PATCH", async () => {
    apiClient.mockResolvedValue(ok(project));
    await updateProjectAction("abc", values);
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/abc");
    expect(apiClient.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(apiClient.mock.calls[0][1].body).target_date).toBe("2026-03-01");
  });

  it("archives with DELETE", async () => {
    apiClient.mockResolvedValue(ok(null));
    await expect(archiveProjectAction("abc")).resolves.toBeUndefined();
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/abc");
    expect(apiClient.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });

  it("throws ApiError on non-success envelopes", async () => {
    apiClient.mockResolvedValue({
      success: false,
      message: "Kode project sudah dipakai",
      code: 409,
      data: null,
    });
    await expect(createProjectAction(values)).rejects.toMatchObject({
      message: "Kode project sudah dipakai",
      status: 409,
    });
    await expect(listProjectsAction({ page: 1, page_size: 10 })).rejects.toMatchObject({
      status: 409,
    });
    await expect(getProjectSummaryAction()).rejects.toMatchObject({ status: 409 });
    await expect(getProjectAction("a")).rejects.toMatchObject({ status: 409 });
    await expect(updateProjectAction("a", values)).rejects.toMatchObject({ status: 409 });
    await expect(archiveProjectAction("a")).rejects.toMatchObject({ status: 409 });
  });
});
