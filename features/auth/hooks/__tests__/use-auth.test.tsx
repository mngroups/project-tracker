import { act, renderHook, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "@/test-utils/test-wrapper";

const loginAction = vi.fn();
const logoutAction = vi.fn();
const toastError = vi.fn();
const clearAllFormDrafts = vi.fn();
vi.mock("../../actions/login-action", () => ({ loginAction }));
vi.mock("../../actions/logout-action", () => ({ logoutAction }));
vi.mock("@/lib/toast", () => ({ toast: { error: toastError } }));
vi.mock("@mono/hooks/form-draft", () => ({ clearAllFormDrafts }));

const { useAuth } = await import("../use-auth");

describe("useAuth", () => {
  const router = useRouter();

  beforeEach(() => vi.clearAllMocks());

  it("goes to the landing route after login", async () => {
    loginAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.login({ username: "budi", password: "x" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("returns to the sanitized ?next= page", async () => {
    window.history.replaceState(null, "", "/login?next=%2Fexample%3Fpage%3D2");
    loginAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.login({ username: "budi", password: "x" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/example?page=2"));
  });

  it("toasts a failed login and stays put", async () => {
    loginAction.mockResolvedValue({ success: false, message: "Password salah" });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.login({ username: "budi", password: "x" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Password salah"));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("logs out, wipes drafts and goes to /login", async () => {
    logoutAction.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.logout());
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(clearAllFormDrafts).toHaveBeenCalled();
  });
});
