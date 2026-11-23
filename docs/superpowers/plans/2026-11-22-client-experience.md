# Client Experience (Phase 1 + 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give clients a reason to open the portal every day: an activity log, "baru" since the last visit, PM notes, weekly updates, insights, and a home page plus a richer project detail that show them.

**Architecture:** Phase 1 (repo `project-tracker-api/`) adds an `activities` log written by the existing services, plus last-seen, notes, daily snapshots, weekly updates and read endpoints. Phase 2 (repo `project-tracker/`) adds `features/home` (`/beranda`), an Aktivitas tab, a notes modal and insight cards, all fed by Server Actions.

**Tech Stack:** Fastify 5, Drizzle, Postgres (PGlite in tests), Zod 4, `@mono/server-kit`, Vercel Cron · Next.js 16, React 19, TanStack Query 5, `@mono/ui` / `@mono/hooks` / `@mono/auth` / `@mono/utils`, Vitest.

**Spec:** `project-tracker/docs/superpowers/specs/2026-11-22-client-experience-design.md`. Read it before every task; its behaviour section is normative.

## Global Constraints

- pnpm 10.33.0, Node 24. Biome. Commit `<type>: <subject>`, type in `feat|fix|ai|ops|perf|refactor|test|chore|docs|change|remove`, no scope.
- API rules: `project-tracker-api/CLAUDE.md`. Services never import Fastify. Every route has Zod request and response schemas. `reply.ok(...)`, never `return reply.ok(...)`. `AppError` with Indonesian copy. `app.requirePermission(PERMISSIONS.x)`. Migrations come from `pnpm db:generate` only. API coverage threshold 80% (`vitest.config.ts`).
- Every API query filters by `org_id`. A row of another org → 404 "Data tidak ditemukan".
- **Clients never receive an `is_internal` activity, note count, snapshot value or summary built from internal tasks.** Visibility uses `Caller.canSeeInternal` from `src/auth-context.ts`.
- FE rules: `project-tracker/CLAUDE.md`. Server Actions only. `@mono/ui` components only. Skeletons, never "Memuat…". `cn()`, no native `<button>`. Tests in `__tests__/`. Works at 360 px. FE coverage 80%.
- Copy is Indonesian. Dates on the wire `YYYY-MM-DD`; timestamps ISO strings. "Today", day and week boundaries use WITA (`Asia/Makassar`).
- After each task: `pnpm lint && pnpm typecheck && pnpm test:run` in the repo touched.

## Deviations from the spec (decided while planning)

1. **"Same transaction" → "right after the change".** The services do not use transactions today; they call `projects.touch()` after each write. Activities are recorded the same way (after the write succeeds, before the response). A crash between the two loses one activity, which is acceptable for a feed.
2. **Sparkline deferred.** It is a new visual component, and the app may not hand-roll components. Phase 2 shows the progress delta as text; the sparkline comes with a `Sparkline` added to `@mono/ui` in a follow-up. The insights endpoint already returns `weekly_progress` so the FE change is small later.

## Review Focus

1. **Internal leakage through aggregates.** A client sees `tasks_done` this week = 0 and no activity when the only change was an internal task completed by the PM. Owner: Task 5 and Task 7.
2. **Status edits that don't change status.** `PATCH task` with the same `status: "done"` twice records one `task_completed`, not two. Owner: Task 2.
3. **The viewer's own actions are never "baru".** A client approving a milestone, then opening home, sees no "baru" dot for their own approval. Owner: Task 3.
4. **Cron called twice for the same day/week.** A retried Vercel Cron run must not duplicate snapshots or weekly updates (unique keys + upsert). Owner: Task 5 and Task 6.
5. **360 px with long names.** A 150-char project name and a 1000-char note wrap on the home cards and in the feed (`min-w-0 break-words`). Owner: Task 9 and Task 10.

---

## Part A — API (`project-tracker-api/`)

### Task 1: Tables

**Files:**
- Modify: `src/db/schema/projects.ts` (or a new `src/db/schema/activity.ts` re-exported from `src/db/schema/index.ts`)
- Create: migration via `pnpm db:generate`
- Test: `src/__tests__/app-db.test.ts` (extend: the new tables exist after migrate)

**Interfaces:**
- Produces (Drizzle tables and `$inferSelect` row types):
  - `activities` / `ActivityRow`: `id uuid pk`, `orgId`, `projectId → projects.id cascade`, `milestoneId uuid null`, `type text` (enum `ACTIVITY_TYPES`, below), `actorId text`, `actorName text`, `isInternal boolean default false`, `payload jsonb default {}`, `createdAt`. Index `(org_id, project_id, created_at desc)`.
  - `projectViews` / `ProjectViewRow`: `orgId`, `userId text`, `projectId → cascade`, `lastSeenAt timestamptz`. PK `(user_id, project_id)`.
  - `projectNotes` / `ProjectNoteRow`: `id`, `orgId`, `projectId → cascade`, `authorId`, `authorName`, `body varchar(1000)`, `createdAt`, `updatedAt`.
  - `progressSnapshots` / `ProgressSnapshotRow`: `orgId`, `projectId → cascade`, `day date`, `progressClient int`, `progressInternal int`, `tasksDoneClient int`, `tasksDoneInternal int`. Unique `(project_id, day)`.
  - `weeklyUpdates` / `WeeklyUpdateRow`: `orgId`, `projectId → cascade`, `weekStart date` (a Monday), `summaryClient jsonb`, `summaryInternal jsonb`, `createdAt`. Unique `(project_id, week_start)`.
  - `export const ACTIVITY_TYPES = ["task_completed", "task_reopened", "milestone_started", "milestone_submitted", "milestone_approved", "milestone_changes_requested", "file_uploaded", "note_posted", "project_status_changed", "project_health_changed", "target_date_changed"] as const;` with a matching `check` constraint.

- [ ] **Step 1:** Add a test in `app-db.test.ts`: after migrate, `select count(*) from activities, project_views, project_notes, progress_snapshots, weekly_updates` succeeds (each returns 0).
- [ ] **Step 2:** Run `pnpm test:run src/__tests__/app-db.test.ts` → FAIL (relation does not exist).
- [ ] **Step 3:** Add the tables, run `pnpm db:generate`, commit the generated SQL unchanged.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** `git commit -m "feat: activity, view, note, snapshot and weekly update tables"`

### Task 2: Record activities from the existing services

**Files:**
- Create: `src/features/activities/repository.ts`, `src/features/activities/recorder.ts`
- Modify: `src/features/tasks/service.ts`, `src/features/milestones/service.ts`, `src/features/attachments/service.ts`, `src/features/projects/service.ts`, `src/app.ts` (wire the recorder into each service factory)
- Test: `src/features/activities/__tests__/recording.test.ts` (route-level, same style as `src/features/tasks/__tests__/routes.test.ts`: `startTestIssuer`, `tokenFor`, `createTestDb`, `buildApp`, then read the `activities` table with `db`)

**Interfaces:**
- Produces:
  - `createActivitiesRepository(db: Db)` with `insert(values: typeof activities.$inferInsert): Promise<void>` (plus the read methods added in Task 3).
  - `createActivityRecorder(repo: ActivitiesRepository)` → `{ record(caller: Caller, a: { projectId: string; milestoneId?: string | null; type: ActivityType; isInternal?: boolean; payload?: Record<string, unknown> }): Promise<void> }`; type `ActivityRecorder`. Actor = `caller.userId` / `caller.userName`.
  - Each service factory gains a last parameter `activity: ActivityRecorder`.
- Payloads (the FE renders copy from these): tasks `{ task_id, title }`; milestones `{ title, note? }`; files `{ attachment_id, file_name }`; status/health `{ from, to }`; target `{ from, to }` (dates or null); notes `{ note_id, excerpt }` (first 140 chars).

Rules (one test each):
- Task status → `done` from anything else: `task_completed`; `done` → anything else: `task_reopened`; same status: nothing. Applies to both `update` and `setStatus`. `isInternal` = the task's `isInternal`; `milestoneId` = the task's milestone.
- Milestone `submit` / `approve` / `request_changes`: `milestone_submitted` / `milestone_approved` / `milestone_changes_requested` (payload `note` for changes). `update` that moves status to `in_progress`: `milestone_started`.
- Attachment commit: `file_uploaded`, `isInternal` = the file's flag.
- Project update: one row per changed field among `status`, `health`, `target_date` (unchanged values record nothing).
- Creating/deleting tasks, milestones and projects, and reordering, record nothing.

- [ ] **Step 1:** Write the tests: `"completing a task records task_completed once"` (PATCH status `done` twice → 1 row, `actor_name` from the token `name`), `"reopening records task_reopened"`, `"internal task completion is recorded as internal"`, `"submit/approve/request_changes record their types"`, `"commit records file_uploaded with the file's internal flag"`, `"project update records one row per changed field"`, `"create, delete and reorder record nothing"`.
- [ ] **Step 2:** Run `pnpm test:run src/features/activities` → FAIL.
- [ ] **Step 3:** Implement the repository and recorder; call `activity.record(...)` in each service right after the write, next to `projects.touch()`. Wire in `src/app.ts`.
- [ ] **Step 4:** Run the new tests and the existing suites (`pnpm test:run`) → PASS.
- [ ] **Step 5:** `git commit -m "feat: record project activities"`

### Task 3: Feed, last-seen and unseen counts

**Files:**
- Create: `src/features/activities/{schema,service,routes,grouping}.ts`
- Modify: `src/features/activities/repository.ts`, `src/app.ts`
- Test: `src/features/activities/__tests__/{grouping,feed-routes}.test.ts`

**Interfaces:**
- Produces (all under `project:view`; project must exist in the caller's org, else 404):
  - `GET /v1/projects/:id/activities?page=1&page_size=20` → `{ items: ActivityItem[]; total: number; last_seen_at: string | null }`. `total` counts raw rows; grouping applies within the page.
  - `ActivityItem = { id: string; type: ActivityType; actor_name: string; created_at: string; is_new: boolean; milestone_id: string | null; payload: Record<string, unknown>; count: number; children: { id: string; payload: Record<string, unknown>; created_at: string }[] }`. `count` = 1 unless grouped.
  - `POST /v1/projects/:id/seen` → `null`. Upserts `project_views.last_seen_at = now()` for the caller.
  - `POST /v1/activities/seen` → `null`. Sets `last_seen_at = now()` for every non-archived project in the caller's org.
  - `GET /v1/activities/unseen` → `{ items: { project_id: string; count: number }[] }`: only projects with count > 0.
  - Pure `groupActivities(rows: ActivityRow[]): ActivityItem[]` minus `is_new` (the service sets it), in `grouping.ts`.
- Rules: `is_new` = `last_seen_at !== null && created_at > last_seen_at && actor_id !== caller.userId`. `last_seen_at` null → every `is_new` false and every unseen count 0. Clients (`!canSeeInternal`) never get `is_internal` rows in the list, `total` or counts. Grouping: consecutive (in the newest-first order) `task_completed` rows with the same `actor_id` and `milestone_id`, whose `created_at` values are within 60 minutes of the group's newest row, merge into one item; `id` and `created_at` come from the newest, `children` hold all of them.

- [ ] **Step 1:** Unit tests for `groupActivities`: 4 completions by one actor in one milestone within 60 min → 1 item with `count: 4`; a different actor in between breaks the group; 61 minutes apart → 2 items; other types never group.
- [ ] **Step 2:** Route tests: `"client never sees internal activities in the feed, total or unseen counts"`; `"own actions are never new"` (Review Focus 3); `"first visit has no new items"`; `"seen clears the unseen count for that project only"`; `"seen-all clears every project"`; `"other org's project is 404"`.
- [ ] **Step 3:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 4:** `git commit -m "feat: activity feed, last-seen and unseen counts"`

### Task 4: PM notes

**Files:**
- Create: `src/features/notes/{repository,schema,service,routes}.ts`
- Modify: `src/app.ts`
- Test: `src/features/notes/__tests__/routes.test.ts`

**Interfaces:**
- Consumes: `ActivityRecorder` (Task 2).
- Produces:
  - `NoteItem = { id: string; author_name: string; body: string; created_at: string; updated_at: string; can_edit: boolean }`. `can_edit` = caller is the author and `now - created_at < 24h`.
  - `GET /v1/projects/:id/notes?limit=5` (`project:view`) → `{ items: NoteItem[] }`, newest first.
  - `POST /v1/projects/:id/notes` (`project:manage`), body `{ body: string }` trimmed, 1–1000 chars → 201 `NoteItem`; records `note_posted` (`isInternal: false`).
  - `PATCH /v1/projects/:id/notes/:nid` and `DELETE` (`project:manage`): only the author within 24 h, else 422 `"Catatan hanya dapat diubah oleh penulisnya dalam 24 jam"`.

- [ ] **Step 1:** Tests: create (201, activity row written), empty/1001-char body → 400, a client cannot post (403), another PM cannot edit (422), the author cannot edit after 24 h (fake the `created_at` with a direct `db.update`), list is newest first, other org → 404.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** `git commit -m "feat: project notes"`

### Task 5: Daily snapshots, insights and the cron endpoint

**Files:**
- Create: `src/features/insights/{snapshots,forecast,schema,service,routes}.ts`, `src/features/cron/routes.ts`
- Modify: `src/env.ts` (`CRON_SECRET: z.string().min(16)`), `src/__tests__/helpers.ts` (`testEnv` default `CRON_SECRET`), `src/app.ts`, `vercel.json` (`"crons"`), `.env.example`, `README.md` (one line on the cron)
- Test: `src/features/insights/__tests__/{forecast,insights-routes}.test.ts`, `src/features/cron/__tests__/routes.test.ts`

**Interfaces:**
- Produces:
  - `takeDailySnapshots(db: Db, day: string): Promise<number>`: upserts one `progress_snapshots` row per non-archived project for `day` (WITA `YYYY-MM-DD`), computing client values without internal tasks and internal values with all tasks (reuse `progressOf` from `src/features/projects/progress.ts`). Idempotent per `(project_id, day)` (Review Focus 4).
  - Pure `forecast(points: { day: string; progress: number }[], targetDate: string | null, status: ProjectStatus): Forecast | null` in `forecast.ts`, where `Forecast = { kind: "insufficient" } | { kind: "on_target"; date: string } | { kind: "late"; date: string; days_late: number; severe: boolean }`. Rules from the spec: `null` for `completed`/`cancelled`; uses the last 14 days of points; `insufficient` with fewer than 7 points or velocity ≤ 0; velocity = (last − first progress) / days between them; `date` = last day + ceil((100 − last progress) / velocity) days; `on_target` when no target or `date <= targetDate`; otherwise `late` with `severe = days_late > 7`.
  - `GET /v1/projects/:id/insights` (`project:view`) → `{ progress: number; progress_delta: number | null; weekly_progress: number[]; week: { tasks_done: number; files_added: number; milestones_moved: number }; forecast: Forecast | null }`. Client or internal values by `canSeeInternal`. `progress_delta` = current − the snapshot 7 days ago, `null` when that snapshot is missing. `weekly_progress` = up to 8 Monday values, oldest first. `week` counts the caller-visible activities of the last 7 days (`task_completed` minus `task_reopened`, floored at 0; `file_uploaded`; `milestone_*`).
  - `GET /internal/cron/daily` and `GET /internal/cron/weekly`: require `authorization: Bearer ${CRON_SECRET}` (Vercel Cron sends it), else 401; excluded from the OpenAPI spec and from user rate limiting. `daily` → `takeDailySnapshots(db, witaToday)`; `weekly` → Task 6's generator. Both reply `{ processed: number }`.
  - `vercel.json` crons: `{ "path": "/internal/cron/daily", "schedule": "5 16 * * *" }` (00:05 WITA) and `{ "path": "/internal/cron/weekly", "schedule": "0 0 * * 1" }` (Monday 08:00 WITA).

- [ ] **Step 1:** `forecast` unit tests: 6 points → insufficient; flat progress → insufficient; 10%→52% over 14 days with target far ahead → `on_target`; same with target 5 days before the projected date → `late`, `days_late: 5`, `severe: false`; 10 days → `severe: true`; completed → `null`.
- [ ] **Step 2:** Route tests: `"client insights exclude internal tasks"` (Review Focus 1: the only completed task this week is internal → client `week.tasks_done` 0, PM 1); `"progress_delta is null without a 7-day-old snapshot"`; `"daily snapshot twice for the same day keeps one row"`; cron without/with the wrong secret → 401.
- [ ] **Step 3:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 4:** `git commit -m "feat: daily snapshots, insights and cron endpoints"`

### Task 6: Weekly updates and the home endpoint

**Files:**
- Create: `src/features/updates/{generator,schema,service,routes}.ts`, `src/features/home/{schema,service,routes}.ts`
- Modify: `src/features/cron/routes.ts` (weekly calls the generator), `src/app.ts`
- Test: `src/features/updates/__tests__/generator.test.ts`, `src/features/home/__tests__/routes.test.ts`

**Interfaces:**
- Consumes: activities (Task 3), notes (Task 4), snapshots + `forecast` (Task 5).
- Produces:
  - `generateWeeklyUpdates(db: Db, weekStart: string): Promise<number>`: for each project not completed/cancelled/archived, upserts `weekly_updates` for the Monday `weekStart`, covering `weekStart` to `weekStart + 6` (WITA). `WeeklySummary = { tasks_done: number; files_added: number; milestones: { title: string; type: ActivityType }[]; progress: number; progress_delta: number | null; forecast: Forecast | null; empty: boolean }`, stored twice (`summaryClient`, `summaryInternal`). Idempotent (Review Focus 4). The cron passes the previous week's Monday.
  - `WeeklyUpdateItem = { week_start: string; summary: WeeklySummary; notes: NoteItem[] }`. Notes are those created in that week, joined at read time.
  - `GET /v1/projects/:id/updates/latest` (`project:view`) → `WeeklyUpdateItem | null`.
  - `GET /v1/home` (`project:view`) → `{ awaiting: { project_id: string; project_name: string; milestone_id: string; milestone_title: string; due_date: string | null; submitted_at: string }[]; projects: { id: string; code: string; name: string; status: ProjectStatus; health: ProjectHealth; progress: number; progress_delta: number | null; unseen_count: number; latest_note: NoteItem | null; latest_update: WeeklyUpdateItem | null }[]; insights: { tasks_done_week: number; files_added_week: number; on_target: number; late: number; active: number } }`. `awaiting` is filled only for callers with `project.milestone:approve`, oldest `submitted_at` first (from the latest `milestone_submitted` activity). `projects` = non-archived, `in_progress`/`planning`/`on_hold` first, then by `updated_at` desc.

- [ ] **Step 1:** Generator tests: a week with no activity → `empty: true`; internal-only activity → client summary empty, internal not; running twice keeps one row.
- [ ] **Step 2:** Home route tests: `awaiting` is empty for a viewer without approve and filled (oldest first) for a client; client counts exclude internal; `unseen_count` matches Task 3; other org's projects absent.
- [ ] **Step 3:** Run → FAIL. Implement. Run → PASS. Run `pnpm openapi` and commit the regenerated spec if the repo tracks it.
- [ ] **Step 4:** `git commit -m "feat: weekly updates and home endpoint"`

---

## Part B — FE (`project-tracker/`)

### Task 7: Schemas, Server Actions and hooks

**Files:**
- Create: `features/activity/schema.ts`, `features/activity/actions/activity.actions.ts`, `features/activity/hooks/use-activity.ts`, `features/home/schema.ts`, `features/home/actions/home.actions.ts`, `features/home/hooks/use-home.ts`
- Test: `features/activity/actions/__tests__/activity.actions.test.ts`, `features/home/actions/__tests__/home.actions.test.ts`, `features/activity/hooks/__tests__/use-activity.test.tsx`

**Interfaces:**
- Consumes: Part A response shapes, verbatim, as Zod schemas wrapped in `apiEnvelope(...)`.
- Produces:
  - Actions: `listActivitiesAction(projectId, page)`, `markProjectSeenAction(projectId)`, `markAllSeenAction()`, `getInsightsAction(projectId)`, `getLatestUpdateAction(projectId)`, `listNotesAction(projectId)`, `createNoteAction(projectId, body)`, `updateNoteAction(projectId, noteId, body)`, `deleteNoteAction(projectId, noteId)`, `getHomeAction()`.
  - Hooks with `ACTIVITY_KEY = ["activity"]` and `HOME_KEY = ["home"]`: `useActivities(projectId)` (`useInfiniteQuery`, 20 per page), `useInsights(projectId)` / `useLatestUpdate(projectId)` / `useNotes(projectId)` (`staleTime: 30_000`), `useMarkSeen(projectId)` (invalidates `HOME_KEY`), `useMarkAllSeen()`, `useNoteMutations(projectId)` (invalidate notes, latest update, activity, home; toast on error with `getErrorMessage`), `useHome()` (`staleTime: 30_000`).
  - Types `ActivityItem`, `Insights`, `Forecast`, `WeeklyUpdateItem`, `NoteItem`, `Home`.
  - `noteFormSchema = z.object({ body: z.string().trim().min(1, "Catatan wajib diisi").max(1000, "Maksimal 1000 karakter") })`.

- [ ] **Step 1:** Action tests mock `@/lib/session` (repo convention): each action calls the right path/method and throws `ApiError` on `success: false`. One hook test: `useMarkSeen` invalidates the home query.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** `git commit -m "feat: activity, notes, insights and home data layer"`

### Task 8: Shared presentation helpers

**Files:**
- Create: `features/activity/helpers/{describe-activity,relative-time,greeting}.ts`, `features/activity/components/activity-line.tsx`
- Test: `features/activity/helpers/__tests__/*.test.ts`, `features/activity/components/__tests__/activity-line.test.tsx`

**Interfaces:**
- Produces:
  - `describeActivity(item: ActivityItem): string`: Indonesian copy per type, e.g. `task_completed` → `Menyelesaikan "${title}"`, grouped → `Menyelesaikan ${count} task`; `milestone_submitted` → `Mengajukan persetujuan "${title}"`; `milestone_approved` → `Menyetujui "${title}"`; `milestone_changes_requested` → `Meminta revisi "${title}"`; `milestone_started` → `Memulai "${title}"`; `file_uploaded` → `Mengunggah ${file_name}`; `note_posted` → `Menulis catatan`; `project_status_changed` / `project_health_changed` → `Mengubah status/kesehatan menjadi ${label}` (labels from `features/projects/schema.ts`); `target_date_changed` → `Mengubah target menjadi ${formatProjectDate(to)}`.
  - `relativeTime(iso: string, now?: Date): string`: "baru saja" (< 1 min), "N menit lalu", "N jam lalu", "kemarin", "N hari lalu" (< 7), then `formatWitaDateTime(iso, "D MMM YYYY")`.
  - `greeting(now?: Date): "Selamat pagi" | "Selamat siang" | "Selamat sore" | "Selamat malam"`: WITA hour < 11 / < 15 / < 18 / else.
  - `<ActivityLine item={ActivityItem} />`: `Avatar` initials of `actor_name`, actor name, `describeActivity`, `relativeTime` wrapped in `Tooltip` with the exact `formatWitaDateTime(..., "D MMM YYYY, HH:mm")`, a "baru" dot when `is_new`, and a `Collapsible` listing `children` titles when `count > 1`. `min-w-0 break-words`.

- [ ] **Step 1:** Unit tests for every `describeActivity` type, `relativeTime` boundaries (59 s, 59 min, 23 h, 1 day, 6 days, 7 days), and `greeting` at 10:59 / 11:00 / 14:59 / 17:59 / 18:00 WITA. A component test: grouped item expands to its children; `is_new` shows the dot.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** `git commit -m "feat: activity presentation helpers"`

### Task 9: Home page `/beranda`

**Files:**
- Create: `app/(protected)/beranda/page.tsx` (thin shell), `features/home/components/{home-page,action-list,insight-strip,project-update-card,home-skeleton}.tsx`
- Modify: `features/app-shell/constants/menu-items.ts` (first entry `{ label: "Beranda", href: "/beranda", icon: Home }`), `lib/permissions/routes.ts` (`"/beranda": ["project:view"]`)
- Test: `features/home/components/__tests__/home-page.test.tsx`

**Interfaces:**
- Consumes: `useHome`, `useMarkAllSeen` (Task 7); `greeting`, `relativeTime` (Task 8); the display name read in the page shell from the `COOKIES.username` cookie (as `app/(protected)/layout.tsx` does for `AppShell`) and passed as `userName` to `<HomePage userName>`; `useCan("project.milestone:approve")`; `ProjectProgress`.
- Produces: the page described in the spec's "Client home" section:
  - Header: `${greeting()}, ${name}` and `"${active} project berjalan · ${awaiting.length} perlu tindakan Anda"` (second half omitted when 0 or not an approver). When every project has `unseen_count` 0 and none was ever seen, a one-line welcome "Selamat datang! Perubahan pada project Anda akan muncul di sini."
  - `ActionList` (approvers only): cards with milestone title, project name, due date, `Button` "Tinjau" as a `Link` to `/projects/${project_id}?tab=milestone&modal=approval&target=${milestone_id}`. Empty: "Tidak ada yang perlu Anda lakukan".
  - `InsightStrip`: `CountUp` values for `tasks_done_week` ("task selesai minggu ini"), `files_added_week` ("file baru"), and forecast "`on_target` dari `active` sesuai target" (warning tone when `late > 0`).
  - `ProjectUpdateCard` per project: name (`line-clamp-2 break-words`), `StatusLabel` health, `ProjectProgress` with "(+N)" delta, a "baru" badge with `unseen_count`, the latest note (avatar, author, `relativeTime`, body clamped to 3 lines) else the latest update summary line ("4 task selesai · 1 file baru" or "Tidak ada perubahan minggu ini"). The whole card links to `/projects/:id`.
  - "Tandai semua dibaca" `Button` (variant `ghost`) when any `unseen_count > 0`.
  - Layout: one column below `md`; from `md`, `grid-cols-[minmax(0,1fr)_20rem]` with actions + updates left, insights right. `HomeSkeleton` while loading.

- [ ] **Step 1:** Tests: greeting + name; approver sees the action card and its deep link `href`; non-approver sees no action section; empty actions copy; insight values; a 150-char project name card has `break-words` and `min-w-0` (Review Focus 5, mobile via the `useIsMobile` mock); "Tandai semua dibaca" calls the action; skeleton while pending; `/` lands on `/beranda` (extend the landing test of `resolveLandingRoute`).
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** `git commit -m "feat: client home page"`

### Task 10: Project detail — Aktivitas tab, notes, insights

**Files:**
- Create: `features/project-detail/components/{activity-tab,latest-update-card,project-insights,note-form-modal}.tsx`
- Modify: `features/project-detail/components/{project-tabs,overview-tab,project-detail-page}.tsx`
- Test: `features/project-detail/components/__tests__/{activity-tab,notes,overview-tab}.test.tsx` (extend `overview-tab.test.tsx`)

**Interfaces:**
- Consumes: Task 7 hooks, Task 8 `ActivityLine`, existing `DeliveryTimeline`, `useModalParam`, `useFormDraft`, `FormActions`.
- Produces:
  - `PROJECT_TABS = ["ringkasan", "aktivitas", "milestone", "file"]`, label "Aktivitas".
  - `ActivityTab`: `useActivities`; a divider "Sejak kunjungan terakhir Anda" between the last `is_new` item and the first older one (absent when nothing is new); "Muat lebih banyak" `Button` while `hasNextPage`; empty "Belum ada aktivitas"; skeleton rows.
  - Mark seen: `ProjectDetailPage` calls `markProjectSeen` once, 3000 ms after the project loads (`setTimeout` cleared on unmount, so leaving earlier does not mark).
  - `LatestUpdateCard` at the top of Ringkasan: the latest note(s) of the week plus the summary line; "Tulis catatan" `Button` for `project:manage` opening `NOTE_FORM_MODAL = "note-form"` (`target` = note id when editing, from a note's `can_edit` menu).
  - `NoteFormModal`: `DynamicModal` + `FloatingTextarea name="body" label="Catatan"`, `noteFormSchema`, `useFormDraft` key `note-form:${projectId}:${target ?? "new"}`, `clearDraft()` on Batal and success; delete with the existing `ConfirmDeleteModal` pattern.
  - `ProjectInsights`: progress with delta, the three `week` counts, and the forecast line: `insufficient` → "Belum cukup data untuk perkiraan"; `on_target` → "Diperkirakan selesai ${date} · Sesuai target"; `late` → "Diperkirakan selesai ${date} · Sekitar ${days_late} hari setelah target" with a warning `StatusLabel` when `severe`; `null` → hidden.
  - Ringkasan order: `LatestUpdateCard`, `ProjectInsights`, `DeliveryTimeline`, then the existing schedule/approval panels (the existing stat tiles merge into `ProjectInsights`).

- [ ] **Step 1:** Tests: divider placement (2 new + 3 old → divider after the 2nd); load more fetches page 2; `markProjectSeen` is called after 3 s with fake timers and not when unmounted at 2 s; PM writes a note (draft cleared, list refreshed), a client sees no "Tulis catatan"; edit opens prefilled when `can_edit`; each forecast kind's copy; a 1000-char note wraps (`break-words`).
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Full check: `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.
- [ ] **Step 4:** `git commit -m "feat: activity tab, notes and insights on project detail"`

### Task 11: End-to-end check

- [ ] **Step 1:** Run the API (`pnpm dev` in `project-tracker-api/`, local Postgres via `docker-compose.yml`) and the FE (`pnpm dev`). Call `GET /internal/cron/daily` with the secret once.
- [ ] **Step 2:** As a PM: complete 3 tasks in one milestone, upload a file, post a note, submit a milestone.
- [ ] **Step 3:** As a client (`project:view` + `project.milestone:approve`): `/` lands on `/beranda`; the action card deep-links into the approval modal; the project card shows "baru 6" (3 completions, file, note, submission: the count is raw rows, while the feed groups the completions into one line); the Aktivitas tab shows the divider; after 3 s on the detail page, home shows no "baru". At 360 px nothing scrolls sideways.
- [ ] **Step 4:** Report results to the user with screenshots; no commit unless fixes were needed.
