#!/usr/bin/env node
// pnpm flag:remove <name>
// Unregisters a feature flag, then typechecks so leftover usages show up.
import { execFileSync } from "node:child_process";
import {
  DOCS,
  ENV_EXAMPLE,
  formatFiles,
  REGISTRY,
  ROOT,
  read,
  writeChanged,
} from "./feature-flag-files.mjs";
import { parseArgs, removeDocsRow, removeEnvLine, removeFlag } from "./feature-flag-lib.mjs";

function main() {
  const { name, help } = parseArgs(process.argv.slice(2));
  if (help || !name) {
    console.log("Usage: pnpm flag:remove <name>");
    if (!help) process.exit(1);
    return;
  }

  const registry = read(REGISTRY);
  const docs = read(DOCS);
  const env = read(ENV_EXAMPLE);
  const removed = removeFlag(registry, name);
  const written = writeChanged([
    [REGISTRY, registry, removed.source],
    [DOCS, docs, docs === null ? null : removeDocsRow(docs, name)],
    [
      ENV_EXAMPLE,
      env,
      removed.scope === "server" && env !== null ? removeEnvLine(env, removed.envVar) : env,
    ],
  ]);
  formatFiles(written);
  console.log(`Removed flag "${name}". Updated: ${written.join(", ")}`);
  console.log(
    "Also drop it from each environment's NEXT_PUBLIC_FEATURE_FLAGS / FEATURE_* variables.\n"
  );

  console.log("Running pnpm typecheck to find leftover usages…");
  try {
    execFileSync("pnpm", ["typecheck"], { cwd: ROOT, stdio: "inherit" });
    console.log("✔ No leftover usages.");
  } catch {
    console.error(`✖ Typecheck failed: remove the remaining "${name}" usages listed above.`);
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(`✖ ${error.message}`);
  process.exit(1);
}
