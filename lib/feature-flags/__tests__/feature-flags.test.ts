import { afterEach, describe, expect, it, vi } from "vitest";

import { CLIENT_FEATURE_FLAG_KEYS, FEATURE_FLAG_KEYS, SERVER_FEATURE_FLAG_KEYS } from "..";
import { isClientFeatureFlag } from "../registry";
import { parseBooleanFlag, resolveFeatureFlagValue } from "../resolve";

describe("registry", () => {
  it("splits flags by scope", () => {
    expect(FEATURE_FLAG_KEYS).toContain("exampleFlag");
    expect(CLIENT_FEATURE_FLAG_KEYS).toContain("exampleFlag");
    expect(SERVER_FEATURE_FLAG_KEYS).not.toContain("exampleFlag");
    expect(isClientFeatureFlag("exampleFlag")).toBe(true);
  });
});

describe("resolve", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses strict booleans", () => {
    expect(parseBooleanFlag("true")).toBe(true);
    expect(parseBooleanFlag("false")).toBe(false);
    expect(parseBooleanFlag("")).toBeNull();
    expect(parseBooleanFlag(undefined)).toBeNull();
    expect(parseBooleanFlag("yes")).toBeNull();
  });

  it("falls back to the default and warns on invalid values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveFeatureFlagValue("exampleFlag", "true")).toBe(true);
    expect(resolveFeatureFlagValue("exampleFlag", undefined, { warnOnInvalid: true })).toBe(false);
    expect(resolveFeatureFlagValue("exampleFlag", "yes")).toBe(false);
    expect(warn).not.toHaveBeenCalled();
    expect(resolveFeatureFlagValue("exampleFlag", "yes", { warnOnInvalid: true })).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("server reader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reads the flag's env var", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "true");
    const { isFeatureEnabled } = await import("../server");
    expect(isFeatureEnabled("exampleFlag")).toBe(true);
  });

  it("stays quiet about invalid values in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "maybe");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { isFeatureEnabled } = await import("../server");
    expect(isFeatureEnabled("exampleFlag")).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
