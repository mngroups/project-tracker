import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
vi.mock("@/lib/session", () => ({ apiClient }));

const { createExampleAction, getExamplesAction } = await import("../example.actions");

const item = { id: "1", name: "A", status: "active", created_at: "2026-11-16T00:00:00Z" };

describe("example actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists with query params", async () => {
    const data = { items: [item], total: 1 };
    apiClient.mockResolvedValue({ success: true, message: "ok", code: 200, data });
    expect(await getExamplesAction({ page: 1, page_size: 10 })).toEqual(data);
    expect(apiClient.mock.calls[0][1]).toMatchObject({ params: { page: 1, page_size: 10 } });
  });

  it("creates with a JSON body", async () => {
    apiClient.mockResolvedValue({ success: true, message: "ok", code: 201, data: item });
    expect(await createExampleAction({ name: "A", note: "" })).toEqual(item);
    expect(apiClient.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: '{"name":"A","note":""}',
    });
  });

  it("throws non-success envelopes", async () => {
    apiClient.mockResolvedValue({ success: false, message: "Gagal", code: 400, data: null });
    await expect(getExamplesAction({ page: 1, page_size: 10 })).rejects.toMatchObject({
      message: "Gagal",
    });
    await expect(createExampleAction({ name: "A", note: "" })).rejects.toMatchObject({
      status: 400,
    });
  });
});
