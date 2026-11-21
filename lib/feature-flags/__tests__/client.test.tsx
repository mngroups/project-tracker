import { render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The client config is read once at module load, so stub the env and re-import.
async function loadClient(raw: string | undefined) {
  vi.resetModules();
  if (raw !== undefined) vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", raw);
  return import("../client");
}

describe("client feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("../registry");
    vi.resetModules();
  });

  it("useFeatureFlag returns the resolved flag", async () => {
    const { useFeatureFlag } = await loadClient(JSON.stringify({ exampleFlag: true }));
    expect(renderHook(() => useFeatureFlag("exampleFlag")).result.current).toBe(true);
  });

  it("accepts string values and ignores other types", async () => {
    const { resolveClientFeatureFlag } = await loadClient(
      JSON.stringify({ exampleFlag: "true", other: 1 })
    );
    expect(resolveClientFeatureFlag("exampleFlag")).toBe(true);
  });

  it.each([
    ["unset", undefined],
    ["invalid JSON", "{"],
    ["an array", "[true]"],
    ["null", "null"],
  ])("falls back to defaults when the config is %s", async (_label, raw) => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    const { resolveClientFeatureFlag } = await loadClient(raw);
    expect(resolveClientFeatureFlag("exampleFlag")).toBe(false);
  });

  it("stays quiet about invalid values in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { resolveClientFeatureFlag } = await loadClient(JSON.stringify({ exampleFlag: "x" }));
    expect(resolveClientFeatureFlag("exampleFlag")).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it("<FeatureFlag> renders children or the fallback", async () => {
    const { FeatureFlag } = await loadClient(JSON.stringify({ exampleFlag: true }));
    render(<FeatureFlag flag="exampleFlag">on</FeatureFlag>);
    expect(screen.getByText("on")).toBeInTheDocument();

    const off = await loadClient(JSON.stringify({ exampleFlag: false }));
    render(
      <>
        <off.FeatureFlag flag="exampleFlag" fallback="fallback">
          hidden
        </off.FeatureFlag>
        <off.FeatureFlag flag="exampleFlag">hidden-2</off.FeatureFlag>
      </>
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
    expect(screen.queryByText("hidden-2")).not.toBeInTheDocument();
  });

  it("refuses to read a server flag", async () => {
    vi.doMock("../registry", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../registry")>();
      const defs = {
        ...actual.FEATURE_FLAG_DEFINITIONS,
        secretFlag: { envVar: "FEATURE_SECRET", defaultValue: false, scope: "server" },
      };
      return {
        ...actual,
        FEATURE_FLAG_DEFINITIONS: defs,
        isClientFeatureFlag: (flag: string) => defs[flag as keyof typeof defs].scope === "client",
      };
    });
    const { resolveClientFeatureFlag } = await loadClient(undefined);
    expect(() => resolveClientFeatureFlag("secretFlag" as never)).toThrow(/server-only/);
  });
});
