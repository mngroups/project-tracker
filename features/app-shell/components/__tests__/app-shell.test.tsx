import { PermissionsProvider } from "@mono/auth/react";
import type { AppShellProps } from "@mono/ui";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTE_PERMISSIONS } from "@/lib/permissions/routes";

const logout = vi.fn();
vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({ login: vi.fn(), isLoggingIn: false, logout, isLoggingOut: false }),
}));
let pathname = "/example";
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => pathname,
}));
vi.mock("@mono/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mono/ui")>();
  return {
    ...actual,
    AppShell: ({ menu, bottomNav, onLogout, onOpenChange, pathname, children }: AppShellProps) => (
      <div data-pathname={pathname}>
        <nav aria-label="Menu">
          {menu.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </nav>
        <nav aria-label="Navigasi mobile">
          {bottomNav?.map((item) => (
            <span key={item.href}>{item.label}</span>
          ))}
        </nav>
        <button type="button" onClick={onLogout}>
          Keluar
        </button>
        <button type="button" onClick={() => onOpenChange?.(false)}>
          Ciutkan sidebar
        </button>
        {children}
      </div>
    ),
  };
});

const { AppShell } = await import("../app-shell");

function renderShell(permissions: string[] | null) {
  return render(
    <PermissionsProvider permissions={permissions} routes={ROUTE_PERMISSIONS}>
      <AppShell defaultOpen userName="budi">
        <p>page</p>
      </AppShell>
    </PermissionsProvider>
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/example";
    document.cookie = "sidebar_state=; max-age=0";
  });

  it("renders the accessible menu, mobile tab and page", () => {
    renderShell(["example.item:view"]);
    expect(screen.getByText("page")).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Menu" })).getByText("Contoh")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Navigasi mobile" })).getByText("Contoh")
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu" }).parentElement).toHaveAttribute(
      "data-pathname",
      "/example"
    );
  });

  it("hides entries the user can't open", () => {
    renderShell([]);
    expect(screen.queryByText("Contoh")).not.toBeInTheDocument();
  });

  it("logs out", () => {
    renderShell(null);
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(logout).toHaveBeenCalled();
  });

  it("persists the sidebar's open state", () => {
    renderShell(null);
    fireEvent.click(screen.getByRole("button", { name: "Ciutkan sidebar" }));
    expect(document.cookie).toContain("sidebar_state=false");
  });
});
