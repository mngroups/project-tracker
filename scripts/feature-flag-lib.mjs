// Pure helpers behind `pnpm flag:new` / `pnpm flag:remove`. They take file
// contents and return new contents, so the CLI entry files only do I/O.
// See docs/guides/feature-flags.md.

export const CLIENT_ENV_VAR = "NEXT_PUBLIC_FEATURE_FLAGS";
export const SCOPES = ["client", "server"];

const NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const REGISTRY_ANCHOR = "} as const satisfies";
const DOCS_HEADING = "## Current flags";

/**
 * `["demoFlag", "--scope", "server", "--description=Text"]` →
 * `{ name, scope, description, help }`. Unknown options throw.
 */
export function parseArgs(argv) {
  const result = { name: undefined, scope: undefined, description: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const [flag, inline] = arg.slice(2).split(/=(.*)/s);
      if (flag !== "scope" && flag !== "description") throw new Error(`Unknown option --${flag}.`);
      const value = inline ?? argv[++i];
      if (value === undefined) throw new Error(`--${flag} needs a value.`);
      result[flag] = value;
      continue;
    }
    if (result.name !== undefined) throw new Error(`Unexpected argument "${arg}".`);
    result.name = arg;
  }
  return result;
}

/** `demoServerFlag` → `DEMO_SERVER_FLAG`. */
export function toScreamingSnake(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toUpperCase();
}

export function envVarFor(name, scope) {
  return scope === "server" ? `FEATURE_${toScreamingSnake(name)}` : CLIENT_ENV_VAR;
}

export function validateName(name) {
  if (!name || !NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid flag name "${name ?? ""}". Use camelCase starting with a lowercase letter (e.g. exportButton).`
    );
  }
}

export function validateScope(scope) {
  if (!SCOPES.includes(scope)) {
    throw new Error(`Invalid scope "${scope}". Use "client" or "server".`);
  }
}

export function validateDescription(description) {
  if (!description?.trim()) throw new Error("A description is required.");
}

/** Flag names declared in `FEATURE_FLAGS` (registry.ts source). */
export function listFlags(registrySource) {
  return [...registrySource.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]);
}

function entryPattern(name) {
  return new RegExp(`^ {2}${name}: \\{\\n[\\s\\S]*?^ {2}\\},\\n`, "m");
}

/** Inserts a new flag (default `false`) at the end of `FEATURE_FLAGS`. */
export function addFlag(registrySource, { name, scope, description }) {
  validateName(name);
  validateScope(scope);
  validateDescription(description);
  if (listFlags(registrySource).includes(name)) {
    throw new Error(`Flag "${name}" already exists in the registry.`);
  }
  const anchor = registrySource.indexOf(REGISTRY_ANCHOR);
  if (anchor === -1) {
    throw new Error(`Could not find "${REGISTRY_ANCHOR}" in the registry.`);
  }
  const entry = [
    `  ${name}: {`,
    `    envVar: ${JSON.stringify(envVarFor(name, scope))},`,
    "    defaultValue: false,",
    `    scope: ${JSON.stringify(scope)},`,
    `    description: ${JSON.stringify(description.trim())},`,
    "  },",
    "",
  ].join("\n");
  return registrySource.slice(0, anchor) + entry + registrySource.slice(anchor);
}

/** Removes a flag; returns the new source plus the removed flag's scope and env var. */
export function removeFlag(registrySource, name) {
  const match = registrySource.match(entryPattern(name));
  if (!match) throw new Error(`Flag "${name}" is not in the registry.`);
  const scope = match[0].match(/scope: "(\w+)"/)?.[1] ?? "client";
  const envVar = match[0].match(/envVar: "(\w+)"/)?.[1] ?? CLIENT_ENV_VAR;
  return { source: registrySource.replace(match[0], ""), scope, envVar };
}

function docsRowPattern(name) {
  return new RegExp(`^\\| \`${name}\` .*\\n`, "m");
}

/** Appends a row to the "Current flags" table. No-op when the row exists. */
export function addDocsRow(docs, { name, scope, envVar }) {
  if (docsRowPattern(name).test(docs)) return docs;
  const heading = docs.indexOf(DOCS_HEADING);
  if (heading === -1) throw new Error(`Could not find "${DOCS_HEADING}" in the flags guide.`);
  const lines = docs.slice(heading).split("\n");
  const firstRow = lines.findIndex((line) => line.startsWith("|"));
  if (firstRow === -1) throw new Error("Could not find the flags table in the guide.");
  let lastRow = firstRow;
  while (lines[lastRow + 1]?.startsWith("|")) lastRow++;
  const offset = lines.slice(0, lastRow + 1).join("\n").length;
  const row = `| \`${name}\` | ${scope} | \`${envVar}\` | \`false\` | TODO |`;
  const at = heading + offset;
  return `${docs.slice(0, at)}\n${row}${docs.slice(at)}`;
}

export function removeDocsRow(docs, name) {
  return docs.replace(docsRowPattern(name), "");
}

/** Adds `FEATURE_X=false` after the last `FEATURE_*` line (server flags only). */
export function addEnvLine(env, envVar) {
  const linePattern = new RegExp(`^${envVar}=`, "m");
  if (linePattern.test(env)) return env;
  const lines = env.split("\n");
  let last = -1;
  lines.forEach((line, i) => {
    if (/^(FEATURE_\w+|NEXT_PUBLIC_FEATURE_FLAGS)=/.test(line)) last = i;
  });
  const line = `${envVar}=false`;
  if (last === -1) return `${env.replace(/\n?$/, "\n")}${line}\n`;
  lines.splice(last + 1, 0, line);
  return lines.join("\n");
}

export function removeEnvLine(env, envVar) {
  return env.replace(new RegExp(`^${envVar}=.*\\n?`, "m"), "");
}

/** What to do after `flag:new`, printed by the CLI. */
export function nextSteps({ name, scope, envVar }) {
  const gate =
    scope === "client"
      ? [
          `  import { useFeatureFlag } from "@/lib/feature-flags/client";`,
          `  const enabled = useFeatureFlag("${name}");`,
          `  // or <FeatureFlag flag="${name}" fallback={…}>…</FeatureFlag>`,
        ]
      : [
          `  import { isFeatureEnabled } from "@/lib/feature-flags/server";`,
          `  if (!isFeatureEnabled("${name}")) notFound();`,
        ];
  const mockModule = scope === "client" ? "client" : "server";
  const mockFn = scope === "client" ? "useFeatureFlag" : "isFeatureEnabled";
  const enable =
    scope === "client"
      ? `  NEXT_PUBLIC_FEATURE_FLAGS={"${name}":true}   # merge into the existing JSON`
      : `  ${envVar}=true`;
  const lines = [
    `Added flag "${name}" (${scope}, default false).`,
    "",
    "Next steps:",
    "1. Gate the code at its entry point:",
    ...gate,
    "2. Test both paths (coverage is 100%):",
    "  let flag = false;",
    `  vi.mock("@/lib/feature-flags/${mockModule}", () => ({ ${mockFn}: () => flag }));`,
    "3. Turn it on locally in .env.local, then restart `pnpm dev`:",
    enable,
    `4. Fill in the "Gates" column of the flag's row in docs/guides/feature-flags.md.`,
  ];
  if (scope === "server") {
    lines.push(
      "",
      `Server flags are read at runtime: set ${envVar} in each environment's container env`,
      "(staging/production) before relying on it there; unset means the registry default (false)."
    );
  }
  return lines.join("\n");
}
