import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const listOrgsAction = vi.fn();
const switchOrgAction = vi.fn();
const toastError = vi.fn();
vi.mock("@/features/auth/actions/org.actions", () => ({ listOrgsAction, switchOrgAction }));
vi.mock("@/lib/toast", () => ({ toast: { error: toastError } }));

const { OrgSwitcher } = await import("../org-switcher");

const ACTIVE = { id: "o1", name: "PT Maju Jaya" };
const OTHER = { id: "o2", name: "CV Sinar Abadi" };

describe("OrgSwitcher", () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
  });

  it("shows the app name when the token carries no org", () => {
    renderWithProviders(<OrgSwitcher org={null} orgCount={0} appName="Monexa App" />);
    expect(screen.getByText("Monexa App")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a single org as plain text without loading the list", () => {
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={1} appName="Monexa App" />);
    expect(screen.getByText("PT Maju Jaya")).toBeInTheDocument();
    expect(screen.getByText("Monexa App")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(listOrgsAction).not.toHaveBeenCalled();
  });

  it("lists the orgs on open with a check on the active one", async () => {
    listOrgsAction.mockResolvedValue([ACTIVE, OTHER]);
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    expect(listOrgsAction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    const active = await screen.findByRole("menuitem", { name: /PT Maju Jaya/ });
    expect(active).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: /CV Sinar Abadi/ })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("switches and reloads to the landing route", async () => {
    listOrgsAction.mockResolvedValue([ACTIVE, OTHER]);
    switchOrgAction.mockResolvedValue({ ok: true });
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /CV Sinar Abadi/ }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    expect(switchOrgAction).toHaveBeenCalledWith("o2");
  });

  it("does nothing when the active org is picked again", async () => {
    listOrgsAction.mockResolvedValue([ACTIVE, OTHER]);
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /PT Maju Jaya/ }));
    expect(switchOrgAction).not.toHaveBeenCalled();
  });

  it("toasts the BE message when the switch is refused", async () => {
    listOrgsAction.mockResolvedValue([ACTIVE, OTHER]);
    switchOrgAction.mockResolvedValue({
      ok: false,
      reason: "org_not_eligible",
      message: "Organisasi tidak tersedia",
    });
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /CV Sinar Abadi/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Organisasi tidak tersedia"));
    expect(assign).not.toHaveBeenCalled();
  });

  it("toasts when the switch itself fails", async () => {
    listOrgsAction.mockResolvedValue([ACTIVE, OTHER]);
    switchOrgAction.mockRejectedValue(new Error("Jaringan bermasalah"));
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /CV Sinar Abadi/ }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Jaringan bermasalah"));
  });

  it("shows skeleton rows while loading and a toast when the list fails", async () => {
    let fail!: (e: Error) => void;
    listOrgsAction.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    renderWithProviders(<OrgSwitcher org={ACTIVE} orgCount={2} appName="Monexa App" />);
    await userEvent.click(screen.getByRole("button", { name: /PT Maju Jaya/ }));
    expect(await screen.findAllByTestId("org-switcher-skeleton")).toHaveLength(2);
    fail(new Error("Gagal memuat organisasi"));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Gagal memuat organisasi"));
  });
});
