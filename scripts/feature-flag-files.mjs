// File I/O shared by the flag CLIs (create-feature-flag.mjs, remove-feature-flag.mjs).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REGISTRY = "lib/feature-flags/registry.ts";
export const DOCS = "docs/guides/feature-flags.md";
export const ENV_EXAMPLE = ".env.example";

export function read(file) {
  const full = path.join(ROOT, file);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}

/** Writes only files whose content changed; returns the changed paths. */
export function writeChanged(changes) {
  const written = [];
  for (const [file, before, after] of changes) {
    if (before === null || before === after) continue;
    writeFileSync(path.join(ROOT, file), after);
    written.push(file);
  }
  return written;
}

export function formatFiles(files) {
  if (files.length === 0) return;
  execFileSync("pnpm", ["exec", "biome", "format", "--write", ...files], {
    cwd: ROOT,
    stdio: "ignore",
  });
}
