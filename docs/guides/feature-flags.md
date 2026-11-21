# Feature Flags

Feature flags make [trunk-based development](./development-workflow.md) work:
unfinished features merge into `main` continuously and stay **off** until a flag
turns them on for an environment. Flags are typed booleans declared in one
registry, [`lib/feature-flags/registry.ts`](../../lib/feature-flags/registry.ts).

| Scope  | Source                                                     | Read with                                                         |
| ------ | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| client | `NEXT_PUBLIC_FEATURE_FLAGS` (one JSON, build time, public) | `useFeatureFlag()` / `<FeatureFlag>` (`lib/feature-flags/client`) |
| server | `FEATURE_<NAME>` (one env var each, runtime, private)      | `isFeatureEnabled()` (`lib/feature-flags/server`)                 |

## Current flags

| Flag          | Scope  | Source                      | Default | Gates                                  |
| ------------- | ------ | --------------------------- | ------- | -------------------------------------- |
| `exampleFlag` | client | `NEXT_PUBLIC_FEATURE_FLAGS` | `false` | "Ekspor" button on the `/example` page |

> `pnpm flag:new` / `pnpm flag:remove` keep this table in sync with `registry.ts`.

## Rules

- **Only `true` enables.** `false`, unset, empty or anything invalid falls back to
  the registry default (with a console warning outside production).
- **New flags default to `false`.** The code path behind it ships dark.
- **Client flags are public and baked in at build time.** Never put anything
  secret in `NEXT_PUBLIC_FEATURE_FLAGS`; a change needs a rebuild.
- **Server flags never reach the browser.** `lib/feature-flags/server.ts` imports
  `server-only`; reading a server flag from client code throws.
- **Flags gate UX, not security.** Permissions and the BE still decide access.
- **Every flag is temporary.** Plan its removal when you add it.

## Adding a flag

```bash
pnpm flag:new exportButton --description "Shows the CSV export on the example list."
pnpm flag:new reportsPage --scope server --description "Makes the Reports page available."
pnpm flag:new   # no arguments: asks for name, scope and description
```

The script validates the name (camelCase, not taken), adds the entry to
`registry.ts` with `defaultValue: false`, adds a row to [Current flags](#current-flags)
(fill in its **Gates** column), adds `FEATURE_<NAME>=false` to `.env.example` for a
server flag, formats the files, and prints the next steps. Its logic lives in
`scripts/feature-flag-lib.mjs` (tested in `scripts/__tests__/`).

### Gate the code

Gate as close to the entry point as possible (route, menu item, button), not in
dozens of leaf components. One check per entry point is easier to remove later.

```tsx
// Client component or hook
import { useFeatureFlag } from "@/lib/feature-flags/client";
const canExport = useFeatureFlag("exampleFlag");

// Declarative wrapper
<FeatureFlag flag="exampleFlag" fallback={<RestrictedPage />}>
  …
</FeatureFlag>;

// Server component / server action
import { isFeatureEnabled } from "@/lib/feature-flags/server";
if (!isFeatureEnabled("reportsPage")) notFound();

// Flag-gated query: the off path makes no BE call
useQuery({ queryKey, queryFn, enabled: useFeatureFlag("exampleFlag") });
```

### Test both paths

Coverage is enforced at 100%, so both branches need a test. Mock the reader with
the same signature as the real module:

```tsx
let flag = false;
vi.mock("@/lib/feature-flags/client", () => ({ useFeatureFlag: () => flag }));

it("hides export when the flag is off", () => {
  flag = false; /* … */
});
it("shows export when the flag is on", () => {
  flag = true; /* … */
});
```

### Turn it on locally

```bash
# .env.local
NEXT_PUBLIC_FEATURE_FLAGS={"exampleFlag":true}
FEATURE_REPORTS_PAGE=true
```

Restart `pnpm dev` after changing it — client flags are inlined at build time.

## Enabling a flag per environment

| Scope  | Where                                                                                       | Takes effect |
| ------ | ------------------------------------------------------------------------------------------- | ------------ |
| client | The `NEXT_PUBLIC_FEATURE_FLAGS` build arg of the image (e.g. a GitHub Environment variable) | Next build   |
| server | Runtime env of the container (`FEATURE_*`)                                                  | Next deploy  |

Typical rollout: enable on staging → QA → enable on production → let it soak → remove the flag.

## Removing a flag

`pnpm flag:remove <name>` removes the registry entry, the docs row and the
`.env.example` line, then runs `pnpm typecheck`, which lists every usage still
left. Then:

1. Delete the old code path and the `useFeatureFlag`/`<FeatureFlag>`/`isFeatureEnabled` calls.
2. Delete the tests for the `false` branch.
3. Remove the key from each environment's `NEXT_PUBLIC_FEATURE_FLAGS`.

Ship it as `remove: <flag> feature flag` so it shows up under **Removed** in the changelog.
