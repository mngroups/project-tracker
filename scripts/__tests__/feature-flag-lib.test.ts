import { describe, expect, it } from "vitest";

import {
  addDocsRow,
  addEnvLine,
  addFlag,
  envVarFor,
  listFlags,
  nextSteps,
  parseArgs,
  removeDocsRow,
  removeEnvLine,
  removeFlag,
  toScreamingSnake,
  validateDescription,
  validateName,
  validateScope,
} from "../feature-flag-lib.mjs";

const REGISTRY = `export const FEATURE_FLAGS = {
  chatV2: {
    envVar: "NEXT_PUBLIC_FEATURE_FLAGS",
    defaultValue: false,
    scope: "client",
    description: "Chat.",
  },
  fuelPage: {
    envVar: "FEATURE_FUEL_PAGE",
    defaultValue: false,
    scope: "server",
    description: "Fuel.",
  },
} as const satisfies Record<string, FeatureFlagDefinition>;
`;

const DOCS = `# Feature Flags

## Current flags

| Flag | Scope | Source | Default | Gates |
| --- | --- | --- | --- | --- |
| \`chatV2\` | client | \`NEXT_PUBLIC_FEATURE_FLAGS\` | \`false\` | Chat |

> Keep this table in sync.
`;

const ENV = `NEXT_PUBLIC_FEATURE_FLAGS={}
FEATURE_FUEL_PAGE=false

API_BASE_URL=x
`;

describe("parseArgs", () => {
  it("reads the name, spaced and inline options", () => {
    expect(parseArgs(["demo", "--scope", "server", "--description=A = b"])).toEqual({
      name: "demo",
      scope: "server",
      description: "A = b",
      help: false,
    });
  });

  it("recognises help", () => {
    expect(parseArgs(["-h"]).help).toBe(true);
    expect(parseArgs(["--help"]).help).toBe(true);
  });

  it("rejects unknown options, missing values and extra arguments", () => {
    expect(() => parseArgs(["--force"])).toThrow(/Unknown option --force/);
    expect(() => parseArgs(["demo", "--scope"])).toThrow(/--scope needs a value/);
    expect(() => parseArgs(["a", "b"])).toThrow(/Unexpected argument "b"/);
  });
});

describe("names and env vars", () => {
  it("converts camelCase to SCREAMING_SNAKE", () => {
    expect(toScreamingSnake("demoServerFlag")).toBe("DEMO_SERVER_FLAG");
    expect(toScreamingSnake("opsKillSwitch")).toBe("OPS_KILL_SWITCH");
    expect(toScreamingSnake("chatV2")).toBe("CHAT_V2");
    expect(toScreamingSnake("pdfURLExport")).toBe("PDF_URL_EXPORT");
  });

  it("picks the env var by scope", () => {
    expect(envVarFor("demo", "client")).toBe("NEXT_PUBLIC_FEATURE_FLAGS");
    expect(envVarFor("demoFlag", "server")).toBe("FEATURE_DEMO_FLAG");
  });

  it("validates name, scope and description", () => {
    expect(() => validateName("demoFlag")).not.toThrow();
    expect(() => validateName("DemoFlag")).toThrow(/Invalid flag name "DemoFlag"/);
    expect(() => validateName("demo-flag")).toThrow(/camelCase/);
    expect(() => validateName(undefined)).toThrow(/Invalid flag name ""/);
    expect(() => validateScope("server")).not.toThrow();
    expect(() => validateScope("edge")).toThrow(/Invalid scope "edge"/);
    expect(() => validateDescription("x")).not.toThrow();
    expect(() => validateDescription("  ")).toThrow(/description is required/);
    expect(() => validateDescription(undefined)).toThrow(/description is required/);
  });
});

describe("registry", () => {
  it("lists flags", () => {
    expect(listFlags(REGISTRY)).toEqual(["chatV2", "fuelPage"]);
  });

  it("adds a client flag before the closing anchor", () => {
    const out = addFlag(REGISTRY, { name: "demoFlag", scope: "client", description: ' Say "hi" ' });
    expect(listFlags(out)).toEqual(["chatV2", "fuelPage", "demoFlag"]);
    expect(out).toContain(`  demoFlag: {
    envVar: "NEXT_PUBLIC_FEATURE_FLAGS",
    defaultValue: false,
    scope: "client",
    description: "Say \\"hi\\"",
  },
} as const satisfies`);
  });

  it("adds a server flag with its own env var", () => {
    const out = addFlag(REGISTRY, { name: "demoFlag", scope: "server", description: "D" });
    expect(out).toContain('envVar: "FEATURE_DEMO_FLAG"');
  });

  it("rejects duplicates, invalid input and a registry without the anchor", () => {
    expect(() => addFlag(REGISTRY, { name: "chatV2", scope: "client", description: "D" })).toThrow(
      /"chatV2" already exists/
    );
    expect(() => addFlag(REGISTRY, { name: "x-y", scope: "client", description: "D" })).toThrow(
      /Invalid flag name/
    );
    expect(() =>
      addFlag("const x = {};", { name: "a", scope: "client", description: "D" })
    ).toThrow(/Could not find "} as const satisfies"/);
  });

  it("removes a flag and reports its scope and env var", () => {
    const added = addFlag(REGISTRY, { name: "demoFlag", scope: "server", description: "D" });
    expect(removeFlag(added, "demoFlag")).toEqual({
      source: REGISTRY,
      scope: "server",
      envVar: "FEATURE_DEMO_FLAG",
    });
    expect(removeFlag(REGISTRY, "chatV2").scope).toBe("client");
  });

  it("falls back to client defaults for an entry without scope/envVar", () => {
    const bare = "  odd: {\n    defaultValue: false,\n  },\n";
    expect(removeFlag(bare, "odd")).toEqual({
      source: "",
      scope: "client",
      envVar: "NEXT_PUBLIC_FEATURE_FLAGS",
    });
  });

  it("rejects removing an unknown flag", () => {
    expect(() => removeFlag(REGISTRY, "nope")).toThrow(/"nope" is not in the registry/);
  });
});

describe("docs table", () => {
  const flag = { name: "demoFlag", scope: "server", envVar: "FEATURE_DEMO_FLAG" };

  it("appends a row after the last table row, once", () => {
    const out = addDocsRow(DOCS, flag);
    expect(out).toContain(
      "| `chatV2` | client | `NEXT_PUBLIC_FEATURE_FLAGS` | `false` | Chat |\n| `demoFlag` | server | `FEATURE_DEMO_FLAG` | `false` | TODO |\n\n> Keep"
    );
    expect(addDocsRow(out, flag)).toBe(out);
  });

  it("removes the row", () => {
    expect(removeDocsRow(addDocsRow(DOCS, flag), "demoFlag")).toBe(DOCS);
    expect(removeDocsRow(DOCS, "nope")).toBe(DOCS);
  });

  it("fails clearly without the heading or table", () => {
    expect(() => addDocsRow("# Flags\n", flag)).toThrow(/"## Current flags"/);
    expect(() => addDocsRow("## Current flags\n\nNone yet.\n", flag)).toThrow(/flags table/);
  });
});

describe(".env.example", () => {
  it("adds the line after the last flag variable, once", () => {
    const out = addEnvLine(ENV, "FEATURE_DEMO_FLAG");
    expect(out).toBe(
      "NEXT_PUBLIC_FEATURE_FLAGS={}\nFEATURE_FUEL_PAGE=false\nFEATURE_DEMO_FLAG=false\n\nAPI_BASE_URL=x\n"
    );
    expect(addEnvLine(out, "FEATURE_DEMO_FLAG")).toBe(out);
  });

  it("appends when there are no flag variables yet", () => {
    expect(addEnvLine("A=1", "FEATURE_X")).toBe("A=1\nFEATURE_X=false\n");
    expect(addEnvLine("A=1\n", "FEATURE_X")).toBe("A=1\nFEATURE_X=false\n");
  });

  it("removes the line", () => {
    expect(removeEnvLine(addEnvLine(ENV, "FEATURE_DEMO_FLAG"), "FEATURE_DEMO_FLAG")).toBe(ENV);
    expect(removeEnvLine(ENV, "FEATURE_NOPE")).toBe(ENV);
  });
});

describe("nextSteps", () => {
  it("explains the client flow", () => {
    const text = nextSteps({ name: "demo", scope: "client", envVar: "NEXT_PUBLIC_FEATURE_FLAGS" });
    expect(text).toContain('useFeatureFlag("demo")');
    expect(text).toContain(
      'vi.mock("@/lib/feature-flags/client", () => ({ useFeatureFlag: () => flag }))'
    );
    expect(text).toContain('NEXT_PUBLIC_FEATURE_FLAGS={"demo":true}');
    expect(text).not.toContain("container env");
  });

  it("explains the server flow and where to set the env var", () => {
    const text = nextSteps({ name: "demo", scope: "server", envVar: "FEATURE_DEMO" });
    expect(text).toContain('isFeatureEnabled("demo")');
    expect(text).toContain("isFeatureEnabled: () => flag");
    expect(text).toContain("FEATURE_DEMO=true");
    expect(text).toContain("container env");
  });
});
