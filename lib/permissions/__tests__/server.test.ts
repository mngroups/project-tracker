import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthCheckAction = vi.fn();
const hasSession = vi.fn();

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  // React.cache only memoizes inside a server request; make it a passthrough.
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/features/auth/actions/auth-check.actions", () => ({ getAuthCheckAction }));
const listOrgs = vi.fn();
vi.mock("@/lib/session", () => ({ hasSession, authFlow: { listOrgs } }));

const { can, canAccessRoute, getActiveOrg, getPermissions, resolveLandingRoute } = await import(
  "../server"
);

// The gate's own rules are tested in @mono/auth; this checks the app's wiring:
// /v1/auth/check as the source, ROUTE_PERMISSIONS as the map, menu order as landing order.
describe("permissions/server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSession.mockResolvedValue(true);
  });

  it("gates routes and picks the landing route from /v1/auth/check", async () => {
    getAuthCheckAction.mockResolvedValue({ user_id: "u1", permissions: ["project:view"] });
    expect(await getPermissions()).toEqual(["project:view"]);
    expect(await canAccessRoute("/projects")).toBe(true);
    expect(await can("project:manage")).toBe(false);
    expect(await resolveLandingRoute()).toBe("/projects");
  });

  it("blocks a mapped route without its permission", async () => {
    getAuthCheckAction.mockResolvedValue({ user_id: "u1", permissions: [] });
    expect(await canAccessRoute("/projects")).toBe(false);
    expect(await resolveLandingRoute()).toBeNull();
  });

  it("skips the check when signed out", async () => {
    hasSession.mockResolvedValue(false);
    expect(await getPermissions()).toBeNull();
    expect(getAuthCheckAction).not.toHaveBeenCalled();
  });

  it("reads the active org from the same check and counts the user's orgs", async () => {
    const org = { id: "o1", name: "PT Maju Jaya" };
    getAuthCheckAction.mockResolvedValue({ user_id: "u1", permissions: [], org });
    listOrgs.mockResolvedValue([org, { id: "o2", name: "CV" }]);
    expect(await getActiveOrg()).toEqual({ org, orgCount: 2 });
  });

  it("skips the org list when the token has no org", async () => {
    getAuthCheckAction.mockResolvedValue({ user_id: "u1", permissions: [], org: null });
    expect(await getActiveOrg()).toEqual({ org: null, orgCount: 0 });
    expect(listOrgs).not.toHaveBeenCalled();
  });

  it("degrades to the plain brand when signed out or the BE fails", async () => {
    hasSession.mockResolvedValue(false);
    expect(await getActiveOrg()).toEqual({ org: null, orgCount: 0 });

    hasSession.mockResolvedValue(true);
    getAuthCheckAction.mockRejectedValue(new Error("down"));
    expect(await getActiveOrg()).toEqual({ org: null, orgCount: 0 });

    const org = { id: "o1", name: "A" };
    getAuthCheckAction.mockResolvedValue({ user_id: "u1", permissions: [], org });
    listOrgs.mockRejectedValue(new Error("down"));
    expect(await getActiveOrg()).toEqual({ org, orgCount: 1 });
  });

  it("lets a session-expiry redirect through", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/logout?reason=session_expired;307;",
    });
    getAuthCheckAction.mockRejectedValue(redirect);
    await expect(getActiveOrg()).rejects.toBe(redirect);
  });
});
