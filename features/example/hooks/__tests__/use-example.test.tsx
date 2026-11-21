import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/test-utils/test-wrapper";

const getExamplesAction = vi.fn();
const createExampleAction = vi.fn();
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock("../../actions/example.actions", () => ({ getExamplesAction, createExampleAction }));
vi.mock("@/lib/toast", () => ({ toast }));

const { useCreateExample, useExamples } = await import("../use-example");

describe("useExamples", () => {
  it("fetches the requested page", async () => {
    getExamplesAction.mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => useExamples({ page: 2, page_size: 10 }), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual({ items: [], total: 0 }));
    expect(getExamplesAction).toHaveBeenCalledWith({ page: 2, page_size: 10 });
  });
});

describe("useCreateExample", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toasts success", async () => {
    createExampleAction.mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useCreateExample(), { wrapper: TestWrapper });
    act(() => result.current.mutate({ name: "A", note: "" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Data berhasil ditambahkan"));
  });

  it("toasts the error message", async () => {
    createExampleAction.mockRejectedValue(new Error("Nama sudah dipakai"));
    const { result } = renderHook(() => useCreateExample(), { wrapper: TestWrapper });
    act(() => result.current.mutate({ name: "A", note: "" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nama sudah dipakai"));
  });
});
