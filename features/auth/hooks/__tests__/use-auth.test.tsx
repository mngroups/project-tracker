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
    logoutAction.mockResolvedValue({ endSessionUrl: null });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.logout());
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(clearAllFormDrafts).toHaveBeenCalled();
    // A Server Action serializes every argument; React Query's context must not reach it.
    expect(logoutAction).toHaveBeenCalledWith();
  });

  it("follows the provider's end-session URL after an sso logout", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    logoutAction.mockResolvedValue({ endSessionUrl: "https://auth.test/session/end" });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    act(() => result.current.logout());
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://auth.test/session/end"));
    expect(router.replace).not.toHaveBeenCalledWith("/login");
    vi.unstubAllGlobals();
  });

  it("exposes the last refused login for inline follow-ups", async () => {
    loginAction.mockResolvedValue({
      success: false,
      message: "Password harus diganti",
      reason: "password_change_required",
    });
    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    expect(result.current.loginRefusal).toBeNull();
    act(() => result.current.login({ username: "budi", password: "x" }));
    await waitFor(() =>
      expect(result.current.loginRefusal).toEqual({
        reason: "password_change_required",
        message: "Password harus diganti",
      })
    );
  });
});
