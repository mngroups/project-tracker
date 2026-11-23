import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const clearAllFormDrafts = vi.fn((event?: Event) => event?.preventDefault());
vi.mock("@mono/hooks/form-draft", () => ({ clearAllFormDrafts }));

const { default: LogoutPage } = await import("../page");

describe("/logout page", () => {
  it("asks for confirmation", async () => {
    render(await LogoutPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Konfirmasi logout")).toBeInTheDocument();
    expect(screen.getByTestId("logout-submit-button")).toHaveTextContent("Logout");
  });

  it("explains an expired session and wipes drafts on submit", async () => {
    render(
      await LogoutPage({
        searchParams: Promise.resolve({ reason: "session_expired", next: "/example" }),
      })
    );
    expect(screen.getByText("Sesi Anda telah berakhir")).toBeInTheDocument();
    const form = screen.getByTestId("logout-submit-button").closest("form") as HTMLFormElement;
    expect(form.getAttribute("action")).toBe(
      "/logout/confirm?reason=session_expired&next=%2Fexample"
    );
    fireEvent.submit(form);
    expect(clearAllFormDrafts).toHaveBeenCalled();
  });
});
