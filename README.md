# Project Tracker

Next.js 16 starter with the Monexa stack and conventions: App Router (Turbopack), React 19,
TypeScript, Tailwind CSS v4, the MoNo design system (`@mono/ui`, built on shadcn/ui),
`@mono/hooks`, `@mono/utils` and `@mono/auth`, TanStack Query v5, Zustand, Zod v4, react-hook-form,
Biome and Vitest (80% coverage enforced).

What you get out of the box:

- **Auth:** login (`/login`), protected route group with an auth gate, logout confirmation
  (`/logout`, CSRF-guarded POST), HttpOnly token cookies, deduped token refresh, auto-logout of
  a dead session.
- **Data layer:** every BE call is a Server Action through `apiClient` (`lib/session.ts`, built by
  `@mono/auth`) with Zod-validated responses.
- **RBAC:** permissions from `GET /v1/auth/check`, a route → permission map, menu filtering,
  `<Can>` / `usePermissions`, fail-open when the check is unreachable.
- **App shell:** the MoNo UI `AppShell` provides the responsive desktop sidebar, mobile menu and
  bottom navigation, account menu and logout. Menu visibility follows the same route permissions.
- **File upload:** `FileUploadDropzone` + `useUploadQueue`: presigned browser → storage upload with
  per-file progress, retry and cancel ([guide](docs/guides/file-upload.md)).
- **Feature flags:** typed registry plus `pnpm flag:new` / `pnpm flag:remove`.
- **Reference feature:** `features/projects/`, a list page with table and mobile cards, skeleton,
  empty state, a URL-backed modal form with drafts. Copy its shape for
  new features.
- **Tooling:** Biome, husky (commit-msg + lint-staged), release-it, PR checks, a standalone
  Dockerfile.

## Run locally with project-tracker-api

The backend lives in `../project-tracker-api`.

1. In the API repo: `pnpm dev:issuer` (dev auth on :9000), then Postgres + MinIO
   (`docker compose up -d`), `pnpm db:migrate` and `pnpm dev` (API on :8080). See its README.
2. Here: `.env.local` with `API_BASE_URL=http://localhost:8080`, then `pnpm dev`.
3. Log in as `pm` / `pm123` (Project Manager), `member` / `member123` (Team Member) or
   `client` / `client123` (Client), all in the dev org "PT Contoh Klien".
4. Before a PR, check `/projects` and every tab of `/projects/[id]` at 360px and 390px in
   Chrome DevTools: no horizontal scroll, sticky footers clear the safe area.

## Use this template

1. Click **Use this template** on GitHub (or copy the repo), then clone it.
2. Rename the app:
   - `package.json` → `name`
   - `lib/app-config.ts` → `APP_NAME` and `APP_COOKIE_PREFIX` (cookies become
     `<prefix>_access_token`, …; give every app its own prefix)
   - `.husky/commit-msg` banner, if you want one
3. Registry access:
   - Set the non-secret `GITLAB_PACKAGE_GROUP_ID` in your shell or shell profile:
     `export GITLAB_PACKAGE_GROUP_ID="123456"` (replace with your GitLab group ID).
   - Create a personal GitLab token with `read_package_registry` access. On macOS, save it in
     Keychain Access as a password item named `monexa-gitlab-npm`, using the username from `id -un`
     as the account. On other platforms, provide it through your password manager as
     `GITLAB_NPM_TOKEN`.
   - Install private packages with `pnpm registry:run install`. The command creates a temporary
     npm config and removes it when pnpm exits; do not commit a token or a generated `.npmrc`.
4. Environment: `cp .env.example .env.local` and set `API_BASE_URL`.
5. Install and run:

   ```bash
   nvm use            # Node 24.22.1 (.nvmrc)
   corepack enable    # pnpm 10.33.0
   pnpm registry:run install
   pnpm dev           # http://localhost:3000
   ```

6. Add your next feature next to `features/projects/` (see CLAUDE.md "Adding a New Feature")
   and update the MoNo UI shell entries in `features/app-shell/constants/menu-items.ts` and
   `lib/permissions/routes.ts`.
7. CI: add the `GITLAB_NPM_TOKEN` repository secret and `GITLAB_PACKAGE_GROUP_ID` Actions variable,
   then mark `lint`, `typecheck`, `test` and `build` as required checks on `main`.

## Template showcase page

The public `/template` page introduces the stack and starter features without requiring API
configuration. Use it as a deployable preview of the template. When the application is ready,
remove `app/template/` and the “Tentang template” link from
`features/auth/components/login-form.tsx` (and its assertion in that component's test).

## Scripts

| Script                                  | What it does                                    |
| --------------------------------------- | ----------------------------------------------- |
| `pnpm dev`                              | Next dev server (port 3000)                     |
| `pnpm build` / `pnpm start`             | Production build (`output: "standalone"`)       |
| `pnpm lint` / `pnpm lint:fix`           | Biome lint + format check / autofix             |
| `pnpm typecheck`                        | `tsc --noEmit`                                  |
| `pnpm test` / `pnpm test:coverage`      | Vitest (watch) / single run with coverage       |
| `pnpm flag:new` / `pnpm flag:remove`    | Add / remove a feature flag                     |
| `pnpm registry:run <pnpm args>`         | Run pnpm with a temporary GitLab registry token |
| `pnpm staging-release` / `pnpm release` | Tag `vX.Y.Z-rc.N` / `vX.Y.Z` with release-it    |

Before pushing: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.

## Docker

```bash
docker build --secret id=gitlab_npm_token,env=GITLAB_NPM_TOKEN \
  --build-arg GITLAB_PACKAGE_GROUP_ID=... \
  --build-arg NEXT_PUBLIC_FEATURE_FLAGS='{}' -t my-app .
docker run -p 3000:3000 -e API_BASE_URL=https://api.example.com my-app
```

The token is a build secret, used only for `pnpm install` and never stored in the image.

## Design system

Read the `@mono/ui` README (or its Storybook) for the component catalog and the consumer setup
this template already applies: CSS import order in `app/globals.css` and `server.deps.inline`
in `vitest.config.ts`.

## Private Monexa packages

This app consumes `@mono/utils`, `@mono/auth`, `@mono/hooks` and `@mono/ui` at `^0.2.0` from the
private GitLab Package Registry. Local installs use `pnpm registry:run`; CI and Docker continue to
use their existing secret-based registry configuration.
