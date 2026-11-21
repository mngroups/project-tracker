import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
vi.mock("@/lib/session", () => ({ apiClient }));

const milestones = await import("../milestones.actions");
const tasks = await import("../tasks.actions");

describe("milestone actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends null for an empty due date", async () => {
    apiClient.mockResolvedValue({ success: true, data: {} });
    await milestones.createMilestoneAction("p1", { title: "A", description: "", due_date: "" });
    const [path, init] = apiClient.mock.calls[0];
    expect(path).toBe("/v1/projects/p1/milestones");
    expect(JSON.parse(init.body).due_date).toBeNull();
  });

  it("PUTs the ordered ids", async () => {
    apiClient.mockResolvedValue({ success: true, data: null });
    await milestones.reorderMilestonesAction("p1", ["b", "a"]);
    const [path, init] = apiClient.mock.calls[0];
    expect(path).toBe("/v1/projects/p1/milestones/order");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ ids: ["b", "a"] });
  });

  it("approve sends the trimmed note and request-changes hits its own path", async () => {
    apiClient.mockResolvedValue({ success: true, data: {} });
    await milestones.approveMilestoneAction("p1", "m1", { note: " ok " });
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/p1/milestones/m1/approve");
    expect(JSON.parse(apiClient.mock.calls[0][1].body)).toEqual({ note: "ok" });
    await milestones.requestMilestoneChangesAction("p1", "m1", { note: "" });
    expect(apiClient.mock.calls[1][0]).toBe("/v1/projects/p1/milestones/m1/request-changes");
    expect(JSON.parse(apiClient.mock.calls[1][1].body)).toEqual({});
  });

  it("throws ApiError on failure", async () => {
    apiClient.mockResolvedValue({ success: false, message: "nope", code: 403 });
    await expect(milestones.submitMilestoneAction("p1", "m1")).rejects.toThrow("nope");
  });
});

describe("task actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("PATCHes the status", async () => {
    apiClient.mockResolvedValue({ success: true, data: {} });
    await tasks.setTaskStatusAction("p1", "t1", "done");
    const [path, init] = apiClient.mock.calls[0];
    expect(path).toBe("/v1/projects/p1/tasks/t1/status");
    expect(JSON.parse(init.body)).toEqual({ status: "done" });
  });

  it("maps empty assignee and date to null and omits an unset is_internal", async () => {
    apiClient.mockResolvedValue({ success: true, data: {} });
    await tasks.createTaskAction("p1", "m1", { title: "T", assignee_name: "", due_date: "" });
    expect(apiClient.mock.calls[0][0]).toBe("/v1/projects/p1/milestones/m1/tasks");
    const body = JSON.parse(apiClient.mock.calls[0][1].body);
    expect(body).toEqual({ title: "T", assignee_name: null, due_date: null });
  });

  it("keeps a partial update partial but still sends an explicit clear", async () => {
    apiClient.mockResolvedValue({ success: true, data: {} });
    await tasks.updateTaskAction("p1", "t1", { title: "Baru" });
    expect(JSON.parse(apiClient.mock.calls[0][1].body)).toEqual({ title: "Baru" });
    await tasks.updateTaskAction("p1", "t1", { assignee_name: "", due_date: "" });
    expect(JSON.parse(apiClient.mock.calls[1][1].body)).toEqual({
      assignee_name: null,
      due_date: null,
    });
  });
});
