# Project Tracker — Agent Instruction Guide

## Project Overview

Next.js 16 (App Router, Turbopack) frontend created from the Monexa app template: the client-facing project tracker (projects, milestones, tasks, files). React 19, TypeScript, Tailwind CSS v4, [Biome](https://biomejs.dev) for lint + format, the **MoNo design system** (`@mono/ui`, shadcn/ui + Radix + Tailwind v4), `@mono/hooks`, `@mono/utils`, `@mono/auth` (session, API client, RBAC), [TanStack Query](https://tanstack.com/query) v5 for server state, [Zustand](https://github.com/pmndrs/zustand) for client state, [Zod](https://zod.dev) v4, [react-hook-form](https://react-hook-form.com), [Vitest](https://vitest.dev) + React Testing Library.

**Package manager:** `pnpm@10.33.0` (lockfile committed; do **not** mix in npm/yarn).
**Node:** 24.22.1 (`.nvmrc`, `engines`, the Dockerfile and CI via `node-version-file`; bump all of them together).

### Key scripts

| Script                                 | What it does                              |
| -------------------------------------- | ----------------------------------------- |
| `pnpm dev`                             | Next dev server (port 3000)               |
| `pnpm build`                           | Production build (`output: "standalone"`) |
| `pnpm test:run` / `pnpm test:coverage` | Vitest single pass / with coverage        |
| `pnpm lint` / `pnpm lint:fix`          | Biome lint + format check / autofix       |
| `pnpm typecheck`                       | `tsc --noEmit` (Biome is not type-aware)  |
| `pnpm flag:new` / `pnpm flag:remove`   | Add / remove a feature flag               |

---

## Directory Structure

```
app/
├── (auth)/login/            # Unauthenticated routes (form, or SSO redirect / error card)
├── auth/start, auth/callback/  # SSO route handlers (sso mode only; 404 otherwise)
├── (protected)/             # Requires a session; layout mounts the shell + route gate
│   ├── layout.tsx
│   └── projects/page.tsx    # Thin shell → features/projects
├── logout/                  # Confirmation page + POST /logout/confirm (revokes, clears cookies, central sign-out)
├── health/, version/
├── layout.tsx               # Root layout: theme script, <Providers>
├── providers.tsx            # ThemeProvider, QueryProvider, UiConfigProvider, Toaster
└── page.tsx                 # "/" → first menu entry the user may open
features/
├── app-shell/               # Sidebar shell, menu items, OrgSwitcher, RestrictedPage
├── auth/                    # Login/logout/org actions, useAuth, LoginForm, SsoErrorCard, ProtectedPage
└── projects/                # Reference feature — copy its shape
lib/
├── app-config.ts            # APP_NAME, cookie prefix and names, getAuthMode(), getAuthPortalUrl()
├── session.ts               # createSession() + createAuthFlow(): apiClient, token cookies, authFlow
├── permissions/             # routes.ts (ROUTE_PERMISSIONS) + server.ts (createPermissionGate)
├── feature-flags/           # Flag registry + server/client readers
└── query/                   # QueryClient defaults, Provider
scripts/                     # flag:new / flag:remove (logic in feature-flag-lib.mjs)
test-utils/                  # renderWithProviders, TestWrapper
proxy.ts                     # Next 16 proxy (ex-middleware): auth redirects + x-pathname
docs/guides/                 # development-workflow, feature-flags, file-upload, mobile-responsive
```

Shared UI, hooks and helpers are **not** in this repo: they come from `@mono/ui`, `@mono/hooks` and `@mono/utils`. Session/API/RBAC plumbing comes from `@mono/auth`; the app only supplies config (`lib/session.ts`, `lib/permissions/`). Don't copy a component into the app to tweak it — extend it via props, or change it in the design-system repo. App-specific shared pieces go in `components/` (create it when needed).

---

## Routing

- `app/(auth)/` — unauthenticated pages.
- `app/(protected)/` — the group's `layout.tsx` mounts `<AppShell>`, `<ProtectedPage>` and the permission route gate once. Pages stay **thin shells** that mount the feature's page component.
- `proxy.ts` only does cheap cookie work: `/` → `/login` when signed out, `/login` → `/` when signed in, and sets the `x-pathname` header the protected layout uses for gating. `/auth/start` and `/auth/callback` must stay reachable both signed in and signed out — never add a redirect rule that catches them.

### Auth modes and routes

`AUTH_MODE` (`credentials` default | `sso`) is server-only and read at runtime; `AUTH_PORTAL_URL` is the monexa-auth origin.

| Route                                  | credentials          | sso                                                                                                  |
| -------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `/login`                               | form (`loginAction`) | → `/auth/start?next=…`; with `?error=` renders `SsoErrorCard`                                        |
| `/auth/start`                          | 404                  | `authFlow.beginSsoLogin` → 307 to monexa-auth                                                        |
| `/auth/callback`                       | 404                  | `authFlow.completeSsoLogin` → `next`, or `/login?error=<reason>`                                     |
| `POST /logout/confirm`, `logoutAction` | revoke + clear       | also redirect to the provider's end-session URL (explicit logout only; a session expiry stays local) |
- The SSO state/PKCE logic lives in `@mono/auth` (`createAuthFlow`). Fix it there, not here.
- Refusal reasons come from the BE as `data.reason` (`reasonOf` from `@mono/auth`). Show the BE's message; on `/login?error=` only the known kit reasons may show `message`, everything else gets the generic copy.
- **CSP is set per request in `proxy.ts`** (`lib/security-headers.ts`), not in `next.config.mjs`: in sso mode `form-action` must also allow the `AUTH_PORTAL_URL` origin, because browsers apply it to the redirects after a form submit (the logout forms end at monexa-auth). Never add a second, static CSP header.
- Link to route handlers with a plain `<a>` (inside `Button asChild`), never `next/link`: a prefetch would run the handler.
- Auth gating (`ProtectedPage`) is UX only; the BE re-checks every request.

---

## Feature Folder Pattern

```
features/<domain>/
├── actions/        # Server Actions ("use server") — wrap apiClient calls
├── components/     # <domain>-page.tsx + its pieces
├── hooks/          # use-<domain>.ts: React Query hooks
├── schema.ts       # Zod schemas + inferred types (schema/ folder once it grows)
└── stores/, helpers/, constants/   # optional
```

| Concern           | Convention             | Example                    |
| ----------------- | ---------------------- | -------------------------- |
| Server Actions    | `<domain>.actions.ts`  | `example.actions.ts`       |
| React Query hooks | `use-<domain>.ts`      | `use-example.ts`           |
| Components        | kebab-case `.tsx`      | `create-example-modal.tsx` |
| Stores            | `use-<store>-store.ts` |                            |

---

## Data Layer

### Server Actions are the only data layer

Every BE call goes through a Server Action in `features/<domain>/actions/`. No client-side `fetch` to the BE. The access token stays in HttpOnly cookies, and auth refresh, the error envelope and schema validation are centralised.

```ts
"use server";

import { ApiError } from "@mono/auth";
import { apiClient } from "@/lib/session";
import { type MyData, type MyParams, myResponseSchema } from "../schema";

export async function getMyDataAction(params: MyParams): Promise<MyData> {
  const res = await apiClient(
    "/v1/my-endpoint",
    { method: "GET", params: params as unknown as Record<string, unknown> },
    myResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}
```

Rules:

- `"use server";` is the first statement of the file.
- Always pass a Zod schema (build it with `apiEnvelope(dataSchema)` from `@mono/auth`) — never trust the BE shape.
- `params` become the query string; bodies go through `body: JSON.stringify(...)`.
- Turn `success: false` into a thrown `ApiError` so TanStack Query's `onError` fires.

### `apiClient` ([lib/session.ts](lib/session.ts))

Built by `createSession()` from `@mono/auth/server` with this app's cookie names and `API_BASE_URL`. `authFlow` (`createAuthFlow()`) shares its token store and handles SSO, logout and org switching. Fix session behaviour in the `mono-auth` repo, not here. `lib/session.ts` is `server-only`, **not** `"use server"`: a `"use server"` module would expose every export (raw tokens included) as a browser-callable Server Action.

| Import from         | What                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `@mono/auth`        | `ApiError`, `apiEnvelope`, `wrapServerAction`, `isRedirectError`, `sanitizeNextPath`, `isGranted`, … |
| `@mono/auth/react`  | `PermissionsProvider`, `usePermissions`, `useCan`, `<Can>`                                           |
| `@mono/auth/server` | `createSession`, `createAuthFlow`, `createPermissionGate`, `assertSameOriginRequest` (server-only)   |
- Base URL from `API_BASE_URL`; bearer token from the access-token cookie.
- No access token but a refresh token → refreshes up-front. On 401 → one deduped refresh (keyed per session — never a module-level slot, the server process is shared by every user) and a retry.
- A dead session (refresh rejected) redirects to `/logout?reason=session_expired` via `endExpiredSession()`. That throws `NEXT_REDIRECT`: never swallow it in a blanket `catch` (rethrow with `isRedirectError`).
- Fail-fast timeout (15s default, `timeoutMs` to override); `API_CLIENT_DEBUG=true` traces requests.

### Cookies (`lib/app-config.ts`)

| Cookie                   | HttpOnly | Purpose                                 |
| ------------------------ | -------- | --------------------------------------- |
| `<prefix>_access_token`  | yes      | Bearer token sent to BE                 |
| `<prefix>_refresh_token` | yes      | Refresh; its presence means "signed in" |
| `<prefix>_username`      | **no**   | Display name only — never trusted       |

---

## React Query Conventions

One `use-<domain>.ts` per feature with a top-level `<DOMAIN>_KEY` const (see `features/projects/hooks/use-projects.ts`).

- `staleTime: 30_000` for snapshot/dashboard data; `0` for paged lists.
- `placeholderData: (prev) => prev` on paginated queries (no table flicker).
- Mutations `invalidateQueries` on the smallest stable prefix.
- Toast via `toast` from `@/lib/toast`; get readable text with `getErrorMessage(error)` from `@mono/utils`. Surface the BE's Indonesian messages as-is.

---

## UI & Styling

- **`@mono/ui` first**: components, shadcn-style primitives (`Button`, `Input`, `Select`, …) and `AppShell` all come from the DS. Browse the catalog in the DS Storybook.
- **CSS order** in `app/globals.css` is fixed: `tailwindcss` → `tw-animate-css` → `@mono/ui/styles.css` → `@mono/ui/theme-default.css`, plus `@source "../node_modules/@mono/ui/dist"`. Rebrand by overriding the tokens in your own file instead of `theme-default.css`.
- No native `<button>`: use `Button` or `PlainButton` from `@mono/ui` (Biome enforces it). `PlainButton`'s `type` defaults to `"submit"` — pass `type="button"` unless it submits a form.
- Compose classes with `cn()` from `@mono/utils`. **Never build class strings with `+`** — Biome's class sorting trims the spaces inside each literal.
- Copy is Indonesian by default.

| Need                 | Use                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table / mobile list  | `DataTable` / `MobileCardList` + `MobileDataCard`                                                                                                                                            |
| Modal                | `DynamicModal` (bottom sheet on mobile, dialog on desktop)                                                                                                                                   |
| Form fields          | `Form` + `FloatingInput` / `FloatingTextarea` / `FloatingSelect`                                                                                                                             |
| Status badge         | `StatusLabel`                                                                                                                                                                                |
| Page title + actions | `PageHeader` (pass `next/link` as `linkComponent`)                                                                                                                                           |
| Collapse             | `Collapsible`                                                                                                                                                                                |
| File upload          | `FileUploadDropzone` (`@mono/ui/file-upload`) + `useUploadQueue` (`@mono/hooks/upload`); presign/commit stay Server Actions. Guide: [docs/guides/file-upload.md](docs/guides/file-upload.md) |

### Mobile — every UI change MUST be responsive

One breakpoint, `md` (768px). Prefer `max-md:`/`md:`; use `useIsMobile()` from `@mono/hooks` only when the tree differs. No horizontal scroll at 360px; fixed bottom UI pads with `var(--safe-bottom)`. Full guide: [docs/guides/mobile-responsive.md](docs/guides/mobile-responsive.md).

### Loading states — MUST use skeleton shimmer

Never ship "Memuat…" / "Loading…". Use `Skeleton` / `TableSkeleton` from `@mono/ui`, shaped like the real content.

---

## Forms

```tsx
const form = useForm<MyValues>({
  resolver: zodResolver(mySchema),
  mode: "onChange",
  defaultValues,
});
```

- `mode: "onChange"` so submit can disable on `!isValid || !isDirty`.
- `.min(1)` on every required string — `z.string()` alone accepts `""`.
- Modal forms open through the URL with `useModalToggle`/`useModalParam` (`@mono/hooks/next`) and keep a draft with `useFormDraft` (`@mono/hooks/form-draft`), called **after** any reset-on-open effect. `clearDraft()` on Batal/success; `clearAllFormDrafts()` on logout. Never draft passwords. See `features/projects/components/project-form-modal.tsx`.

---

## Client State (Zustand)

Only for client-only state that outlives a component (UI filters, toggles). Server data goes through React Query, never Zustand. Feature-local stores live in `features/<domain>/stores/`; promote to a root `stores/` only when two features need one.

---

## Permissions (RBAC)

Everything flows from `GET /v1/auth/check` → `{ user_id, permissions: string[], org: { id, name } | null }`; the FE never hardcodes a catalog. Permissions belong to the token's **active org**.

### Organizations

- The active org comes from the check (`getActiveOrg()` in `lib/permissions/server.ts`, request-cached with the gate); the shell's `OrgSwitcher` shows it and switches via `switchOrgAction`, then reloads `/`.
- **Never persist org-scoped data**: no org data in Zustand or `localStorage`. The switch reloads the page, which drops the in-memory React Query cache, so query keys need no org id; a persisted cache would need one.

A granted `:all` parent includes every descendant (`project:all` grants `project.task:update`).

| Concern                                      | Where                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Route → permission map (menu, landing, gate) | `lib/permissions/routes.ts::ROUTE_PERMISSIONS`                                |
| Access rule                                  | `isRouteAllowed` / `isGranted` from `@mono/auth`                              |
| Server gate & landing route                  | `lib/permissions/server.ts::canAccessRoute`, `resolveLandingRoute`            |
| Client checks                                | `usePermissions` / `useCan`, `<Can perm="…">` from `@mono/auth/react`         |
| Delivery                                     | `PermissionsProvider` (`permissions` + `routes`), fed by the protected layout |
- **Hide, don't disable.** A blocked route renders `<RestrictedPage />` inside the shell.
- **Fail open when permissions are unknown** (`/v1/auth/check` unreachable); the BE still authorizes.
- **Never derive render structure from a client-only fetch** — permissions come from a server prop so SSR and hydration agree.
- FE gating is UX only.

---

## Feature Flags

Trunk-based: unfinished user-facing work ships behind a flag (default `false`). Create one with `pnpm flag:new <name> --description "…"` (`--scope server` for a runtime env flag); remove with `pnpm flag:remove <name>`. Guide: [docs/guides/feature-flags.md](docs/guides/feature-flags.md).

---

## Testing

- **Tests live in `__tests__/` next to the file under test.** Never co-locate `*.test.ts(x)`.
- Mocks must match the real signature (e.g. `useAuth()` returns `{ login, isLoggingIn, loginRefusal, logout, isLoggingOut }`).
- Mock Server Actions, not `apiClient`, in component/hook tests. Server Action tests mock `@/lib/session`.
- `renderWithProviders` (`test-utils/render.tsx`) wires QueryClient + Toaster.
- `vitest.setup.tsx` mocks `next/navigation` (search params follow `window.location`), `next/headers`, `next/link`, `next/image`, `matchMedia` (desktop). For the mobile branch, mock `@mono/hooks` partially (`importOriginal`) with `useIsMobile: () => true`.
- `server.deps.inline: [/@mono(xa)?\//]` makes `vi.mock("next/navigation")` reach the DS packages — keep it.
- Prefer ARIA queries over positional ones.
- **Coverage is enforced at 80%.** Unreachable branch → delete it, or keep a genuine defensive guard with `/* v8 ignore next -- @preserve <reason> */`. Thin route shells are excluded automatically (`vitest.config.ts`).

---

## Always run lint after any change

After every edit: `pnpm lint` (fix every error) and `pnpm typecheck`. Don't add `biome-ignore` unless you can say exactly why the rule is wrong for that line (reason after a colon, comment above the statement).

Before pushing: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` — all four must pass.

### Commits & PRs

- Trunk-based, short-lived branches off `main`, squash-merged. Guide: [docs/guides/development-workflow.md](docs/guides/development-workflow.md).
- `commit-msg` accepts only `<type>: <subject>`, type in `feat|fix|ai|ops|perf|refactor|test|chore|docs|change|remove` — no `(scope)`, no `style`/`build`/`ci`.

---

## Adding a New Feature — Recipe

1. `features/<domain>/` with `actions/`, `components/`, `hooks/`, `schema.ts` (copy `features/projects/`).
2. Schemas: request params + `apiEnvelope(...)` responses; export inferred types.
3. Server Actions in `actions/<domain>.actions.ts`.
4. React Query hooks in `hooks/use-<domain>.ts` with a `<DOMAIN>_KEY`.
5. Components; the top-level one is `<domain>-page.tsx`. Desktop table + mobile cards, skeleton loading, empty state.
6. Route: `app/(protected)/<domain>/page.tsx` as a thin shell.
7. Menu entry in `features/app-shell/constants/menu-items.ts` (also the landing order) and its permission in `lib/permissions/routes.ts`.
8. Unfinished? `pnpm flag:new <name>` and gate the entry point.
9. Tests in `__tests__/` folders (mock the Server Actions).
10. `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.

## Common Pitfalls

1. **Empty-string Zod.** `z.string()` accepts `""`; use `.min(1)`.
2. **`"use server"` placement** — first statement, or the function runs client-side.
3. **Don't fetch from the browser.** Server Action even for a simple GET.
4. **Don't lift server data into Zustand.**
5. **Calling a `"use client"` export from a Server Component fails at build** ("Attempted to call … from the server"). Keep server-side helpers in modules without the directive (e.g. `getThemeInitScript` lives in `@mono/hooks`' directive-free `theme-init-script` module, so `app/layout.tsx` can call it).
6. **Never build class strings with `+`.** Use `cn()`.
