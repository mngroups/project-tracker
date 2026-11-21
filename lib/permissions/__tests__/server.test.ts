import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthCheckAction = vi.fn();
const hasSession = vi.fn();

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  // React.cache only memoizes inside a server request; make it a passthrough.
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/features/auth/actions/auth-check.actions", () => ({ getAuthCheckAction }));
vi.mock("@/lib/session", () => ({ hasSession }));

const { can, canAccessRoute, getPermissions, resolveLandingRoute } = await import("../server");

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
});
