#!/usr/bin/env node
// pnpm flag:new <name> [--scope client|server] [--description "…"]
// Registers a feature flag (default false) and prints how to use it.
import { createInterface } from "node:readline/promises";
import {
  DOCS,
  ENV_EXAMPLE,
  formatFiles,
  REGISTRY,
  read,
  writeChanged,
} from "./feature-flag-files.mjs";
import {
  addDocsRow,
  addEnvLine,
  addFlag,
  envVarFor,
  nextSteps,
  parseArgs,
  validateDescription,
  validateName,
  validateScope,
} from "./feature-flag-lib.mjs";

const USAGE = `Usage: pnpm flag:new <name> [--scope client|server] [--description "…"]
Missing values are asked for interactively.`;

async function ask(rl, question, validate, fallback) {
  for (;;) {
    const answer = (await rl.question(question)).trim() || fallback;
    try {
      validate(answer);
      return answer;
    } catch (error) {
      console.error(error.message);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  let { name, scope, description } = args;
  // --scope is optional (client); only a missing name or description starts the prompts.
  if (name === undefined || description === undefined) {
    if (!process.stdin.isTTY) throw new Error(`Missing arguments.\n${USAGE}`);
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      name ??= await ask(rl, "Flag name (camelCase): ", validateName);
      scope ??= await ask(rl, "Scope (client/server) [client]: ", validateScope, "client");
      description ??= await ask(rl, "Description: ", validateDescription);
    } finally {
      rl.close();
    }
  }
  scope ??= "client";
  const envVar = envVarFor(name, scope);

  const registry = read(REGISTRY);
  const docs = read(DOCS);
  const env = read(ENV_EXAMPLE);
  const written = writeChanged([
    [REGISTRY, registry, addFlag(registry, { name, scope, description })],
    [DOCS, docs, docs === null ? null : addDocsRow(docs, { name, scope, envVar })],
    [ENV_EXAMPLE, env, scope === "server" && env !== null ? addEnvLine(env, envVar) : env],
  ]);
  formatFiles(written);

  console.log(`Updated: ${written.join(", ")}\n`);
  console.log(nextSteps({ name, scope, envVar }));
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
