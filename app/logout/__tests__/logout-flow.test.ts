import { describe, expect, it } from "vitest";

import { logoutStateFromSearchParams } from "../logout-flow";

describe("logoutStateFromSearchParams", () => {
  it("reads a plain logout from URLSearchParams", () => {
    expect(logoutStateFromSearchParams(new URLSearchParams())).toEqual({
      reason: null,
      nextPath: null,
      formAction: "/logout/confirm",
      target: "/login",
    });
  });

  it("drops an unknown reason", () => {
    const state = logoutStateFromSearchParams(new URLSearchParams("reason=other"));
    expect(state.reason).toBeNull();
    expect(state.target).toBe("/login");
  });

  it("takes the first value of an array param and treats a missing one as null", () => {
    const state = logoutStateFromSearchParams({
      reason: ["session_expired", "x"],
      next: [],
    });
    expect(state.reason).toBe("session_expired");
    expect(state.nextPath).toBeNull();
    expect(state.formAction).toBe("/logout/confirm?reason=session_expired");
  });

  it("treats undefined record values as null", () => {
    const state = logoutStateFromSearchParams({ reason: undefined });
    expect(state.reason).toBeNull();
    expect(state.formAction).toBe("/logout/confirm");
  });
});
