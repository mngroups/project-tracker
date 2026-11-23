import { beforeEach, describe, expect, it, vi } from "vitest";

const authFlow = { listOrgs: vi.fn(), switchOrg: vi.fn() };
vi.mock("@/lib/session", () => ({ authFlow }));

const { listOrgsAction, switchOrgAction } = await import("../org.actions");

describe("org actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the user's orgs", async () => {
    authFlow.listOrgs.mockResolvedValue([{ id: "o1", name: "A" }]);
    expect(await listOrgsAction()).toEqual([{ id: "o1", name: "A" }]);
  });

  it("switches org and passes the result through", async () => {
    authFlow.switchOrg.mockResolvedValue({ ok: true });
    expect(await switchOrgAction("o2")).toEqual({ ok: true });
    expect(authFlow.switchOrg).toHaveBeenCalledWith("o2");
  });

  it("refuses a malformed org id without calling the BE", async () => {
    expect(await switchOrgAction("" as string)).toMatchObject({ ok: false });
    expect(await switchOrgAction(42 as unknown as string)).toMatchObject({ ok: false });
    expect(authFlow.switchOrg).not.toHaveBeenCalled();
  });
});
