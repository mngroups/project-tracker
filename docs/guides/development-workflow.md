# Development Workflow — Trunk-Based Development

`main` is the trunk: the only long-lived branch, always releasable, and the
source of every build. Work happens on short-lived branches that merge back into
`main` within a day or two, and anything not ready for users ships **dark**
behind a [feature flag](./feature-flags.md). Staging and production are **tags on
`main`** (`vX.Y.Z-rc.N` and `vX.Y.Z`), not branches.

## Principles

| Principle                             | In practice                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **`main` is always releasable**       | Every merge passes lint, typecheck, tests and build.                                          |
| **Small, short-lived branches**       | A PR merges within 2 days and is reviewable in one sitting (roughly < 400 changed lines).     |
| **Merge incomplete work, hide it**    | Split big features into small PRs; keep unfinished UI behind a flag that defaults to `false`. |
| **Separate refactors from behaviour** | A refactor PR changes no behaviour.                                                           |
| **Fix forward**                       | A bug on `main` gets a new small PR; revert only when the fix isn't obvious.                  |

## Day-to-day flow

```bash
git switch main && git pull --ff-only
git switch -c feat/<ticket>/<short-name>      # or fix/…, refactor/…, docs/…
pnpm flag:new myFeature --description "…"     # if the work is user-facing and unfinished
# … small commits; the pre-commit hook runs Biome on staged files
pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
git push -u origin HEAD                        # open a PR to main
```

PRs are **squash-merged**, so the PR title becomes the commit on `main`.

## Commit messages

The `commit-msg` hook only accepts `<type>: <subject>`:

| Type                         | Use for                       | Changelog section |
| ---------------------------- | ----------------------------- | ----------------- |
| `feat`                       | New user-facing behaviour     | Added             |
| `fix`                        | Bug fixes                     | Fixed             |
| `perf`                       | Performance                   | Improved          |
| `change`                     | Behaviour change              | Changed           |
| `remove`                     | Removed behaviour (or a flag) | Removed           |
| `refactor`                   | Code change, same behaviour   | –                 |
| `test`                       | Tests only                    | Test              |
| `docs`, `chore`, `ops`, `ai` | Everything else               | –                 |

No `(scope)`, and no `style`/`build`/`ci`. release-it writes `chore: release x.y.z[-rc.n]`.

## Releasing

- `pnpm staging-release` cuts `vX.Y.Z-rc.N` from `main` (staging build).
- `pnpm release` cuts `vX.Y.Z` (production) and a GitHub release with the changelog.

Wire your deploy pipeline to build on those tags.
