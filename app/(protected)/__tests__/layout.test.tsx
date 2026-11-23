import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.fn();
const headersGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
  headers: vi.fn(async () => ({ get: headersGet })),
}));
const server = {
  canAccessRoute: vi.fn(),
  getPermissions: vi.fn(),
  resolveLandingRoute: vi.fn(),
  getActiveOrg: vi.fn(),
};
vi.mock("@/lib/permissions/server", () => server);
vi.mock("@/features/auth/components/protected-page", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/features/app-shell/components/app-shell", () => ({
  AppShell: ({
    children,
    userName,
    org,
    orgCount,
  }: {
    children: React.ReactNode;
    userName: string;
    org: { name: string } | null;
    orgCount: number;
  }) => (
    <div
      data-testid="app-shell"
      data-user-name={userName}
      data-org={org?.name ?? ""}
      data-org-count={orgCount}
    >
      {children}
    </div>
  ),
}));

const { default: ProtectedLayout } = await import("../layout");

describe("protected layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.getPermissions.mockResolvedValue(["project:view"]);
    server.resolveLandingRoute.mockResolvedValue("/projects");
    server.getActiveOrg.mockResolvedValue({ org: { id: "o1", name: "PT A" }, orgCount: 2 });
  });

  it("hands the active org to the shell", async () => {
    headersGet.mockReturnValue(null);
    render(await ProtectedLayout({ children: <p>page</p> }));
    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-org", "PT A");
    expect(shell).toHaveAttribute("data-org-count", "2");
  });

  it("renders an allowed page", async () => {
    cookieGet.mockReturnValue({ value: "false" });
    headersGet.mockReturnValue("/projects");
    server.canAccessRoute.mockResolvedValue(true);
    render(await ProtectedLayout({ children: <p>page</p> }));
    expect(screen.getByText("page")).toBeInTheDocument();
  });

  it("skips the gate when the pathname is unknown", async () => {
    headersGet.mockReturnValue(null);
    render(await ProtectedLayout({ children: <p>page</p> }));
    expect(server.canAccessRoute).not.toHaveBeenCalled();
    expect(screen.getByText("page")).toBeInTheDocument();
  });

  it("uses a neutral display name when the username cookie is missing", async () => {
    cookieGet.mockReturnValue(undefined);
    headersGet.mockReturnValue(null);
    render(await ProtectedLayout({ children: <p>page</p> }));
    expect(screen.getByTestId("app-shell")).toHaveAttribute("data-user-name", "Pengguna");
  });

  it("shows the restricted page for a blocked route", async () => {
    headersGet.mockReturnValue("/projects");
    server.canAccessRoute.mockResolvedValue(false);
    render(await ProtectedLayout({ children: <p>page</p> }));
    expect(screen.getByText("Anda tidak memiliki akses ke halaman ini.")).toBeInTheDocument();
  });

  it("offers logout when no menu is reachable at all", async () => {
    headersGet.mockReturnValue("/projects");
    server.canAccessRoute.mockResolvedValue(false);
    server.resolveLandingRoute.mockResolvedValue(null);
    render(await ProtectedLayout({ children: <p>page</p> }));
    expect(screen.getByText(/belum memiliki akses/)).toBeInTheDocument();
  });
});
