import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect,
}));
vi.mock("@/features/auth/components/login-form", () => ({
  default: ({
    passwordChangeUrl,
    logoUrl,
  }: {
    passwordChangeUrl: string | null;
    logoUrl: string | null;
  }) => (
    <div data-testid="login-form" data-logo={logoUrl ?? ""}>
      {passwordChangeUrl}
    </div>
  ),
}));

const { default: LoginPage } = await import("../page");

async function renderPage(params: Record<string, string | string[]> = {}) {
  render(await LoginPage({ searchParams: Promise.resolve(params) }));
}

describe("/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    redirect.mockClear();
  });

  it("renders the credentials form by default, with the password-change URL", async () => {
    vi.stubEnv("AUTH_PORTAL_URL", "https://auth.test/");
    await renderPage();
    expect(screen.getByTestId("login-form")).toHaveTextContent(
      "https://auth.test/account/password"
    );
  });

  it("sends an sso visitor to /auth/start, keeping a safe next path", async () => {
    vi.stubEnv("AUTH_MODE", "sso");
    await expect(renderPage({ next: "/x" })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/auth/start?next=%2Fx");

    await expect(renderPage({ next: "https://evil.example" })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenLastCalledWith("/auth/start");

    // A repeated param counts once: the first value wins.
    await expect(renderPage({ next: ["/a", "/b"] })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenLastCalledWith("/auth/start?next=%2Fa");
  });

  it("shows the generic sso error card with a retry link instead of looping", async () => {
    vi.stubEnv("AUTH_MODE", "sso");
    await renderPage({ error: "state_mismatch", message: "<b>ignored</b>" });
    expect(redirect).not.toHaveBeenCalled();
    expect(
      screen.getByText("Proses masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coba lagi" })).toHaveAttribute("href", "/auth/start");
  });

  it("shows the BE message for a known refusal, as text, with the password-change link", async () => {
    vi.stubEnv("AUTH_MODE", "sso");
    vi.stubEnv("AUTH_PORTAL_URL", "https://auth.test");
    await renderPage({ error: "password_change_required", message: "<b>Ganti dulu</b>" });
    expect(screen.getByText("<b>Ganti dulu</b>")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ganti password" })).toHaveAttribute(
      "href",
      "https://auth.test/account/password"
    );
  });

  it("passes the client's logo URL when AUTH_ORG_HINT names one", async () => {
    vi.stubEnv("AUTH_PORTAL_URL", "https://auth.test");
    vi.stubEnv("AUTH_ORG_HINT", "pt maju");
    await renderPage();
    expect(screen.getByTestId("login-form")).toHaveAttribute(
      "data-logo",
      "https://auth.test/branding/orgs/pt%20maju/logo"
    );
  });

  it("passes no logo without a hint", async () => {
    vi.stubEnv("AUTH_PORTAL_URL", "https://auth.test");
    await renderPage();
    expect(screen.getByTestId("login-form")).toHaveAttribute("data-logo", "");
  });

  it("shows the client logo on the sso error card too", async () => {
    vi.stubEnv("AUTH_MODE", "sso");
    vi.stubEnv("AUTH_PORTAL_URL", "https://auth.test");
    vi.stubEnv("AUTH_ORG_HINT", "pt-maju");
    await renderPage({ error: "state_mismatch" });
    expect(screen.getAllByRole("img", { hidden: true })[0]).toHaveAttribute(
      "src",
      "https://auth.test/branding/orgs/pt-maju/logo"
    );
  });
});
