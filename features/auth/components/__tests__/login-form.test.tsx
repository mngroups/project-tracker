import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
let isLoggingIn = false;
let loginRefusal: { reason?: string; message: string } | null = null;
const toastInfo = vi.fn();
vi.mock("../../hooks/use-auth", () => ({
  useAuth: () => ({ login, isLoggingIn, loginRefusal, logout: vi.fn(), isLoggingOut: false }),
}));
vi.mock("@/lib/toast", () => ({ toast: { info: toastInfo } }));

const { default: LoginForm } = await import("../login-form");

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoggingIn = false;
    loginRefusal = null;
  });

  it("links to the public template overview", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: "Tentang template" })).toHaveAttribute(
      "href",
      "/template"
    );
  });

  it("enables submit only once both fields are filled, then logs in", async () => {
    render(<LoginForm />);
    const submit = screen.getByTestId("login-submit-button");
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByTestId("login-username-input"), "budi");
    await userEvent.type(screen.getByTestId("login-password-input"), "rahasia");
    await waitFor(() => expect(submit).toBeEnabled());

    fireEvent.submit(submit.closest("form") as HTMLFormElement);
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ username: "budi", password: "rahasia" })
    );
  });

  it("shows the pending state", () => {
    isLoggingIn = true;
    render(<LoginForm />);
    expect(screen.getByTestId("login-submit-button")).toHaveTextContent("Memproses");
  });

  it("explains a session-expiry bounce once", () => {
    window.history.replaceState(null, "", "/login?reason=session_expired");
    const { rerender } = render(<LoginForm />);
    rerender(<LoginForm />);
    expect(toastInfo).toHaveBeenCalledTimes(1);
  });

  it("offers the password-change link only when the BE requires a new password", () => {
    const url = "https://auth.test/account/password";
    loginRefusal = { reason: "invalid_credentials", message: "Username atau password salah" };
    const { rerender } = render(<LoginForm passwordChangeUrl={url} />);
    expect(screen.queryByRole("link", { name: "Ganti password" })).not.toBeInTheDocument();

    loginRefusal = { reason: "password_change_required", message: "Password harus diganti" };
    rerender(<LoginForm passwordChangeUrl={url} />);
    expect(screen.getByText("Password harus diganti")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ganti password" })).toHaveAttribute("href", url);
  });
});
