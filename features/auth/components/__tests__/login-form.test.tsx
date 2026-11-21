import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
let isLoggingIn = false;
const toastInfo = vi.fn();
vi.mock("../../hooks/use-auth", () => ({
  useAuth: () => ({ login, isLoggingIn, logout: vi.fn(), isLoggingOut: false }),
}));
vi.mock("@/lib/toast", () => ({ toast: { info: toastInfo } }));

const { default: LoginForm } = await import("../login-form");

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoggingIn = false;
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
});
