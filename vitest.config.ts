import { globSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

// Route files (page/layout) that hold real logic and stay in coverage.
const ROUTE_FILES_WITH_LOGIC = new Set([
  "app/layout.tsx",
  "app/page.tsx",
  "app/logout/page.tsx",
  "app/(protected)/layout.tsx",
]);

function thinRouteShells(): string[] {
  return globSync("app/**/{page,layout,loading}.tsx", { cwd: __dirname })
    .filter((file) => !ROUTE_FILES_WITH_LOGIC.has(file))
    .map((file) => file.replace(/[()[\]]/g, "\\$&"));
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.tsx",
    include: ["**/__tests__/**/*.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "**/.next/**", "**/coverage/**"],
    css: true,
    // Transform @mono/* instead of loading them untouched from node_modules,
    // so `vi.mock("next/navigation")` / `vi.mock("@mono/hooks")` reach their imports.
    server: { deps: { inline: [/@mono\//] } },
    testTimeout: process.env.CI ? 20_000 : 5_000,
    hookTimeout: process.env.CI ? 30_000 : 10_000,
    retry: process.env.CI ? 1 : 0,
    forceRerunTriggers: [
      ...configDefaults.forceRerunTriggers,
      "**/vitest.config.*",
      "**/vitest.setup.*",
      "**/pnpm-lock.yaml",
      "**/tsconfig.json",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      // Count every source file, so an untested one shows up as 0% instead of vanishing.
      include: [
        "app/**/*.{ts,tsx}",
        "features/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "stores/**/*.{ts,tsx}",
        // The feature-flag CLIs are thin I/O wiring; their logic lives in *-lib.mjs.
        "scripts/**/*-lib.mjs",
        "proxy.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.*",
        "**/__tests__/**",
        // Thin route shells only mount a feature component (CLAUDE.md "Page composition rule").
        ...thinRouteShells(),
      ],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "test-utils/server-only.ts"),
    },
  },
});
