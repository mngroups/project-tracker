`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |# Project Tracker — Agent Instruction Guide
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Project Overview
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Next.js 16 (App Router, Turbopack) frontend created from the Monexa app template: the client-facing project tracker (projects, milestones, tasks, files). React 19, TypeScript, Tailwind CSS v4, [Biome](https://biomejs.dev) for lint + format, the **MoNo design system** (`@mono/ui`, shadcn/ui + Radix + Tailwind v4), `@mono/hooks`, `@mono/utils`, `@mono/auth` (session, API client, RBAC), [TanStack Query](https://tanstack.com/query) v5 for server state, [Zustand](https://github.com/pmndrs/zustand) for client state, [Zod](https://zod.dev) v4, [react-hook-form](https://react-hook-form.com), [Vitest](https://vitest.dev) + React Testing Library.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |**Package manager:** `pnpm@10.33.0` (lockfile committed; do **not** mix in npm/yarn).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |**Node:** 24.22.1 (`.nvmrc`, `engines`, the Dockerfile and CI via `node-version-file`; bump all of them together).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Key scripts
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Script | What it does |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || -------------------------------------- | ----------------------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm dev` | Next dev server (port 3000) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm build` | Production build (`output: "standalone"`) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm test:run` / `pnpm test:coverage` | Vitest single pass / with coverage |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm lint` / `pnpm lint:fix` | Biome lint + format check / autofix |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm typecheck` | `tsc --noEmit` (Biome is not type-aware) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `pnpm flag:new` / `pnpm flag:remove` | Add / remove a feature flag |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Directory Structure
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |``
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |app/
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── (auth)/login/            # Unauthenticated routes
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── (protected)/             # Requires a session; layout mounts the shell + route gate
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |│   ├── layout.tsx
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |│   └── projects/page.tsx    # Thin shell → features/projects
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── logout/                  # Confirmation page + POST /logout/confirm (clears cookies)
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── health/, version/
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── layout.tsx               # Root layout: theme script, <Providers>
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── providers.tsx            # ThemeProvider, QueryProvider, UiConfigProvider, Toaster
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |└── page.tsx                 # "/" → first menu entry the user may open
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |features/
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── app-shell/               # Sidebar shell, menu items, RestrictedPage
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── auth/                    # Login/logout actions, useAuth, LoginForm, ProtectedPage
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |└── projects/                # Reference feature — copy its shape
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |lib/
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── app-config.ts            # APP_NAME, cookie prefix and names
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── session.ts               # createSession(): apiClient, token cookies, endExpiredSession
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── permissions/             # routes.ts (ROUTE_PERMISSIONS) + server.ts (createPermissionGate)
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── feature-flags/           # Flag registry + server/client readers
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |└── query/                   # QueryClient defaults, Provider
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |scripts/                     # flag:new / flag:remove (logic in feature-flag-lib.mjs)
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |test-utils/                  # renderWithProviders, TestWrapper
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |proxy.ts                     # Next 16 proxy (ex-middleware): auth redirects + x-pathname
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |docs/guides/                 # development-workflow, feature-flags, file-upload, mobile-responsive
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |``
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Shared UI, hooks and helpers are **not** in this repo: they come from `@mono/ui`, `@mono/hooks` and `@mono/utils`. Session/API/RBAC plumbing comes from `@mono/auth`; the app only supplies config (`lib/session.ts`, `lib/permissions/`). Don't copy a component into the app to tweak it — extend it via props, or change it in the design-system repo. App-specific shared pieces go in `components/` (create it when needed).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Routing
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `app/(auth)/` — unauthenticated pages.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `app/(protected)/` — the group's `layout.tsx` mounts `<AppShell>`, `<ProtectedPage>` and the permission route gate once. Pages stay **thin shells** that mount the feature's page component.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `proxy.ts` only does cheap cookie work: `/` → `/login` when signed out, `/login` → `/` when signed in, and sets the `x-pathname` header the protected layout uses for gating.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Auth gating (`ProtectedPage`) is UX only; the BE re-checks every request.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Feature Folder Pattern
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |``
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |features/<domain>/
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── actions/        # Server Actions ("use server") — wrap apiClient calls
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── components/     # <domain>-page.tsx + its pieces
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── hooks/          # use-<domain>.ts: React Query hooks
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |├── schema.ts       # Zod schemas + inferred types (schema/ folder once it grows)
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |└── stores/, helpers/, constants/   # optional
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |``
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Concern | Convention | Example |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || ----------------- | ---------------------- | -------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Server Actions | `<domain>.actions.ts` | `example.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || React Query hooks | `use-<domain>.ts` | `use-example.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Components | kebab-case `.tsx` | `create-example-modal.tsx` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Stores | `use-<store>-store.ts` | |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Data Layer
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Server Actions are the only data layer
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Every BE call goes through a Server Action in `features/<domain>/actions/`. No client-side `fetch` to the BE. The access token stays in HttpOnly cookies, and auth refresh, the error envelope and schema validation are centralised.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |``ts
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |"use server";
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |import { ApiError } from "@mono/auth";
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |import { apiClient } from "@/lib/session";
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |import { type MyData, type MyParams, myResponseSchema } from "../schema";
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |export async function getMyDataAction(params: MyParams): Promise<MyData> {
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  const res = await apiClient(
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |    "/v1/my-endpoint",
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |    { method: "GET", params: params as unknown as Record<string, unknown> },
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |    myResponseSchema
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  );
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  if (!res.success) throw new ApiError(res.message, res.code, res.code);
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  return res.data;
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |}
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |``
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Rules:
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `"use server";` is the first statement of the file.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Always pass a Zod schema (build it with `apiEnvelope(dataSchema)` from `@mono/auth`) — never trust the BE shape.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `params` become the query string; bodies go through `body: JSON.stringify(...)`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Turn `success: false` into a thrown `ApiError` so TanStack Query's `onError` fires.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### `apiClient` ([lib/session.ts](lib/session.ts))
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Built by `createSession()` from `@mono/auth/server` with this app's cookie names and `API_BASE_URL`. Fix session behaviour in the `mono-auth` repo, not here. `lib/session.ts` is `server-only`, **not** `"use server"`: a `"use server"` module would expose every export (raw tokens included) as a browser-callable Server Action.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Import from | What |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || ------------------- | ---------------------------------------------------------------------------------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `@mono/auth` | `ApiError`, `apiEnvelope`, `wrapServerAction`, `isRedirectError`, `sanitizeNextPath`, `isGranted`, … |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `@mono/auth/react` | `PermissionsProvider`, `usePermissions`, `useCan`, `<Can>` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `@mono/auth/server` | `createSession`, `createPermissionGate`, `assertSameOriginRequest` (server-only) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Base URL from `API_BASE_URL`; bearer token from the access-token cookie.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- No access token but a refresh token → refreshes up-front. On 401 → one deduped refresh (keyed per session — never a module-level slot, the server process is shared by every user) and a retry.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- A dead session (refresh rejected) redirects to `/logout?reason=session_expired` via `endExpiredSession()`. That throws `NEXT_REDIRECT`: never swallow it in a blanket `catch` (rethrow with `isRedirectError`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Fail-fast timeout (15s default, `timeoutMs` to override); `API_CLIENT_DEBUG=true` traces requests.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Cookies (`lib/app-config.ts`)
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Cookie | HttpOnly | Purpose |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || ------------------------ | -------- | --------------------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `<prefix>_access_token` | yes | Bearer token sent to BE |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `<prefix>_refresh_token` | yes | Refresh; its presence means "signed in" |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || `<prefix>_username` | **no** | Display name only — never trusted |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## React Query Conventions
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |One `use-<domain>.ts` per feature with a top-level `<DOMAIN>_KEY` const (see `features/projects/hooks/use-projects.ts`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `staleTime: 30_000` for snapshot/dashboard data; `0` for paged lists.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `placeholderData: (prev) => prev` on paginated queries (no table flicker).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Mutations `invalidateQueries` on the smallest stable prefix.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Toast via `toast` from `@/lib/toast`; get readable text with `getErrorMessage(error)` from `@mono/utils`. Surface the BE's Indonesian messages as-is.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## UI & Styling
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **`@mono/ui` first**: components, shadcn-style primitives (`Button`, `Input`, `Select`, …) and `AppShell` all come from the DS. Browse the catalog in the DS Storybook.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **CSS order** in `app/globals.css` is fixed: `tailwindcss` → `tw-animate-css` → `@mono/ui/styles.css` → `@mono/ui/theme-default.css`, plus `@source "../node_modules/@mono/ui/dist"`. Rebrand by overriding the tokens in your own file instead of `theme-default.css`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- No native `<button>`: use `Button` or `PlainButton` from `@mono/ui` (Biome enforces it). `PlainButton`'s `type` defaults to `"submit"` — pass `type="button"` unless it submits a form.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Compose classes with `cn()` from `@mono/utils`. **Never build class strings with `+`** — Biome's class sorting trims the spaces inside each literal.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Copy is Indonesian by default.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Need | Use |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Table / mobile list | `DataTable` / `MobileCardList` + `MobileDataCard` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Modal | `DynamicModal` (bottom sheet on mobile, dialog on desktop) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Form fields | `Form` + `FloatingInput` / `FloatingTextarea` / `FloatingSelect` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Status badge | `StatusLabel` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Page title + actions | `PageHeader` (pass `next/link` as `linkComponent`) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Collapse | `Collapsible` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || File upload | `FileUploadDropzone` (`@mono/ui/file-upload`) + `useUploadQueue` (`@mono/hooks/upload`); presign/commit stay Server Actions. Guide: [docs/guides/file-upload.md](docs/guides/file-upload.md) |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Mobile — every UI change MUST be responsive
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |One breakpoint, `md` (768px). Prefer `max-md:`/`md:`; use `useIsMobile()` from `@mono/hooks` only when the tree differs. No horizontal scroll at 360px; fixed bottom UI pads with `var(--safe-bottom)`. Full guide: [docs/guides/mobile-responsive.md](docs/guides/mobile-responsive.md).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Loading states — MUST use skeleton shimmer
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Never ship "Memuat…" / "Loading…". Use `Skeleton` / `TableSkeleton` from `@mono/ui`, shaped like the real content.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Forms
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |``tsx
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |const form = useForm<MyValues>({
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  resolver: zodResolver(mySchema),
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  mode: "onChange",
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |  defaultValues,
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |});
`project-form-modal.tsx`   |`use-projects.ts`     |`projects.actions.ts` |``
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `mode: "onChange"` so submit can disable on `!isValid || !isDirty`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `.min(1)` on every required string — `z.string()` alone accepts `""`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Modal forms open through the URL with `useModalToggle`/`useModalParam` (`@mono/hooks/next`) and keep a draft with `useFormDraft` (`@mono/hooks/form-draft`), called **after** any reset-on-open effect. `clearDraft()` on Batal/success; `clearAllFormDrafts()` on logout. Never draft passwords. See `features/projects/components/project-form-modal.tsx`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Client State (Zustand)
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Only for client-only state that outlives a component (UI filters, toggles). Server data goes through React Query, never Zustand. Feature-local stores live in `features/<domain>/stores/`; promote to a root `stores/` only when two features need one.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Permissions (RBAC)
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Everything flows from `GET /v1/auth/check` → `{ user_id, permissions: string[] }`; the FE never hardcodes a catalog. A granted `:all` parent includes every descendant (`project:all` grants `project.task:update`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Concern | Where |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || -------------------------------------------- | ----------------------------------------------------------------------------- |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Route → permission map (menu, landing, gate) | `lib/permissions/routes.ts::ROUTE_PERMISSIONS` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Access rule | `isRouteAllowed` / `isGranted` from `@mono/auth` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Server gate & landing route | `lib/permissions/server.ts::canAccessRoute`, `resolveLandingRoute` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Client checks | `usePermissions` / `useCan`, `<Can perm="…">` from `@mono/auth/react` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` || Delivery | `PermissionsProvider` (`permissions` + `routes`), fed by the protected layout |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **Hide, don't disable.** A blocked route renders `<RestrictedPage />` inside the shell.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **Fail open when permissions are unknown** (`/v1/auth/check` unreachable); the BE still authorizes.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **Never derive render structure from a client-only fetch** — permissions come from a server prop so SSR and hydration agree.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- FE gating is UX only.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Feature Flags
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Trunk-based: unfinished user-facing work ships behind a flag (default `false`). Create one with `pnpm flag:new <name> --description "…"` (`--scope server` for a runtime env flag); remove with `pnpm flag:remove <name>`. Guide: [docs/guides/feature-flags.md](docs/guides/feature-flags.md).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Testing
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **Tests live in `__tests__/` next to the file under test.** Never co-locate `*.test.ts(x)`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Mocks must match the real signature (e.g. `useAuth()` returns `{ login, isLoggingIn, logout, isLoggingOut }`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Mock Server Actions, not `apiClient`, in component/hook tests. Server Action tests mock `@/lib/session`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `renderWithProviders` (`test-utils/render.tsx`) wires QueryClient + Toaster.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `vitest.setup.tsx` mocks `next/navigation` (search params follow `window.location`), `next/headers`, `next/link`, `next/image`, `matchMedia` (desktop). For the mobile branch, mock `@mono/hooks` partially (`importOriginal`) with `useIsMobile: () => true`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `server.deps.inline: [/@mono(xa)?\//]` makes `vi.mock("next/navigation")` reach the DS packages — keep it.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Prefer ARIA queries over positional ones.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- **Coverage is enforced at 80%.** Unreachable branch → delete it, or keep a genuine defensive guard with `/* v8 ignore next -- @preserve <reason> */`. Thin route shells are excluded automatically (`vitest.config.ts`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Always run lint after any change
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |After every edit: `pnpm lint` (fix every error) and `pnpm typecheck`. Don't add `biome-ignore` unless you can say exactly why the rule is wrong for that line (reason after a colon, comment above the statement).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |Before pushing: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` — all four must pass.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |### Commits & PRs
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- Trunk-based, short-lived branches off `main`, squash-merged. Guide: [docs/guides/development-workflow.md](docs/guides/development-workflow.md).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |- `commit-msg` accepts only `<type>: <subject>`, type in `feat|fix|ai|ops|perf|refactor|test|chore|docs|change|remove` — no `(scope)`, no `style`/`build`/`ci`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |---
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Adding a New Feature — Recipe
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |1. `features/<domain>/` with `actions/`, `components/`, `hooks/`, `schema.ts` (copy `features/projects/`).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |2. Schemas: request params + `apiEnvelope(...)` responses; export inferred types.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |3. Server Actions in `actions/<domain>.actions.ts`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |4. React Query hooks in `hooks/use-<domain>.ts` with a `<DOMAIN>_KEY`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |5. Components; the top-level one is `<domain>-page.tsx`. Desktop table + mobile cards, skeleton loading, empty state.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |6. Route: `app/(protected)/<domain>/page.tsx` as a thin shell.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |7. Menu entry in `features/app-shell/constants/menu-items.ts` (also the landing order) and its permission in `lib/permissions/routes.ts`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |8. Unfinished? `pnpm flag:new <name>` and gate the entry point.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |9. Tests in `__tests__/` folders (mock the Server Actions).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |10. `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |## Common Pitfalls
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |1. **Empty-string Zod.** `z.string()` accepts `""`; use `.min(1)`.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |2. **`"use server"` placement** — first statement, or the function runs client-side.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |3. **Don't fetch from the browser.** Server Action even for a simple GET.
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |4. **Don't lift server data into Zustand.**
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |5. **Calling a `"use client"` export from a Server Component fails at build** ("Attempted to call … from the server"). Keep server-side helpers in modules without the directive (e.g. `getThemeInitScript` lives in `@mono/hooks`' directive-free `theme-init-script` module, so `app/layout.tsx` can call it).
`project-form-modal.tsx` |`use-projects.ts` |`projects.actions.ts` |6. **Never build class strings with `+`.** Use `cn()`.
