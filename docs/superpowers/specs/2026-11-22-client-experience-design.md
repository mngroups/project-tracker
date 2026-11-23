# Project Tracker — client experience redesign (design)

Date: 2026-11-22 · Status: approved

## Context

The portal today is a passive status record: project list → detail with Ringkasan / Milestone / File tabs, plus milestone approval. Opening it never shows anything _new_: no narrative, no people, no "what changed since I was here". The owner, putting themselves in the client's shoes, would not use it. The goal is **daily use**: a client with a running project opens the portal on their own because there is always something new and it is clear what they need to do.

Research (Basecamp clients + automatic check-ins, Linear project updates, agency client-portal guides) points the same way: written updates instead of status meetings, an activity feed that "does the notifying", an approval queue with reminders, transparent history.

## Decisions made with the owner

| Topic                 | Decision                                                                         |
| --------------------- | -------------------------------------------------------------------------------- |
| Moment that matters   | Daily use, not the sales demo                                                    |
| Weekly update content | Mixed: auto summary from data, plus an optional PM note                          |
| Pull-back channel     | Email + in-app (WhatsApp later, maybe)                                           |
| Two-way discussion    | No. One-way for now; discussion stays on WA/email                                |
| Visual direction      | Personal and narrative, with dashboard insights                                  |
| Insights              | This week's activity, progress change, forecast finish date (not approval speed) |
| Approach              | A: backend activity log as the single source, released in phases                 |

## Goals / non-goals / anti-goals

**Goals:** a client home page that answers "what needs me, what's new, are we on track"; a weekly update per project that is never empty; "new since your last visit" across devices; in-app bell; emails for approvals, reminders and a weekly digest.

**Non-goals:** comments/discussion threads, WhatsApp, real-time websockets, a PM/staff dashboard redesign, sales-demo polish, rich-text editing.

**Anti-goals (fails even if it works):**
- An internal task, file or note leaking to a client through the feed, counts, insights, bell or email.
- Notification spam: a client getting one email per task tick.
- "Baru" markers that never clear, or that flood a first-time visitor.
- A forecast that alarms without enough data behind it.

## Approaches

|                                           | Trade-off                                                                                                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Backend activity log (picked)**      | Services write an `activities` row on every client-relevant change; feed, "baru", bell, email, digest and insights all read it. Most backend work up front, one foundation for everything. |
| B. Frontend diff of a stored snapshot     | No backend work, but no email, no cross-device "baru", no ordered history, no trends. Ruled out by the email decision.                                                                     |
| C. A + vendor (Knock/Novu) for bell/email | Saves notification plumbing, adds a vendor, cost and client data leaving the system. Worth it only if channels multiply.                                                                   |

Picked A by the owner, released in phases, each shippable alone.

## Phases

1. **Foundation (API):** activity log, last-seen, daily progress snapshots, PM notes, insight + feed endpoints.
2. **Client experience (FE):** home page, detail redesign, Aktivitas tab, "baru" markers, insights, weekly update cards.
3. **In-app bell.**
4. **Email:** approval needed, reminders, weekly digest. Has an open dependency (below).

## Behaviour

### Activity log (Phase 1)

- Table `activities(id, org_id, project_id, milestone_id?, type, actor_id, actor_name, is_internal, payload jsonb, created_at)`, index `(org_id, project_id, created_at desc)`.
- Written inside the same transaction as the change, by the services in `project-tracker-api/src/features/{tasks,milestones,attachments,projects}/service.ts`. Actor comes from `callerOf()` in `src/auth-context.ts`.
- Types: `task_completed`, `task_reopened`, `milestone_submitted` (→ awaiting approval), `milestone_approved`, `milestone_changes_requested`, `milestone_started`, `file_uploaded`, `note_posted`, `project_status_changed`, `project_health_changed`, `target_date_changed`.
- `is_internal` = the task/file is internal. Clients never get internal rows, in any endpoint or count (same rule as today's progress, see Review Focus 1 in the project-tracker plan).
- Grouping at read time: consecutive `task_completed` by the same actor in the same milestone within 60 minutes show as one line, "4 task selesai di Desain" (expandable).

### Last seen / "baru"

- Table `project_views(user_id, project_id, last_seen_at)`. `POST /projects/:id/seen` when the detail page has been open for 3 s (so a mis-tap doesn't clear it).
- An activity is "baru" when `created_at > last_seen_at` and the actor is not the viewer.
- First visit ever (`last_seen_at` null): no markers. The home shows a one-time welcome line instead of a flood.
- Home shows a dot and count per project. The detail Aktivitas tab shows a divider "Sejak kunjungan terakhir Anda". "Tandai semua dibaca" sets `last_seen_at = now()` for all of the viewer's projects.

### Progress snapshots and insights

- A daily snapshot per project at 00:05 WITA (Vercel Cron → an internal endpoint guarded by a shared secret): `progress_client`, `progress_internal`, `tasks_done_client`, `tasks_done_internal`. Two values, so client trends exclude internal tasks.
- **Perubahan progres:** current progress vs the snapshot 7 days ago, e.g. "68% (+12 minggu ini)". Plus a small 8-week sparkline. Under 2 snapshots: no delta shown.
- **Aktivitas minggu ini:** tasks done, files added, milestones that changed status, over the last 7 days (client-visible rows only).
- **Perkiraan selesai:** linear velocity over the last 14 days of snapshots. Shown only with ≥ 7 snapshots and velocity > 0; otherwise "Belum cukup data untuk perkiraan". Wording: on or before target → "Sesuai target"; 1–7 days late → "Sekitar N hari setelah target" (neutral tone); > 7 days → same, with a warning tone. Completed/cancelled projects show no forecast.

### Weekly update (mixed)

- Generated Monday 08:00 WITA per active project (same cron mechanism), covering the previous Monday–Sunday, and stored in `weekly_updates(project_id, week_start, summary jsonb)` so it reads the same later and feeds the digest: counts, progress delta, milestone moves, forecast. PM notes posted that week are joined at read time. Two stored summaries per week (client and internal view), like the snapshots.
- No activity at all: "Tidak ada perubahan minggu ini" (and the PM is nudged, Phase 3).
- **PM note:** users with `project:manage` get "Tulis catatan" on the detail page (a `DynamicModal`, plain text 1–1000 chars with line breaks, `useFormDraft`). Always client-visible. The author can edit or delete it for 24 hours. Shown with the author's initials avatar (`Avatar` from `@mono/ui`), name and relative time.

### Client home (Phase 2)

New route `/beranda`, the first menu entry and so the landing page for everyone (my call: one page for all roles instead of branching on role). "Perlu tindakan" only renders for users with `project.milestone:approve`. Sections, top to bottom:
1. Greeting by WITA time (pagi < 11:00, siang < 15:00, sore < 18:00, malam) + the name from the token claim, then one line: "2 project berjalan · 1 perlu tindakan Anda".
2. **Perlu tindakan Anda:** milestones awaiting the viewer's approval, oldest first, with project, due date and a "Tinjau" button that deep-links to `/projects/:id?tab=milestone&modal=approval&target=<id>` (existing `APPROVAL_MODAL`). Empty: "Tidak ada yang perlu Anda lakukan".
3. **Insight strip:** progress change, this week's activity, forecast, across the viewer's active projects (per-project values on the detail page).
4. **Update terbaru:** one card per project with the latest weekly update or PM note, "baru" dot, and progress with delta.

Layout: single column on mobile; on desktop, actions + updates on the left, insights + a compact project list on the right. Skeletons for every section. Relative times ("2 jam lalu") with the exact time in a `Tooltip`.

```
Selamat pagi, Pak Budi
2 project berjalan · 1 perlu tindakan Anda
┌ Perlu tindakan ───────────────────────┐
│ Desain UI · Portal Klien · s/d Kamis  │
│                            [Tinjau →] │
└───────────────────────────────────────┘
┌ +12% minggu ini │ 8 task │ Sesuai target ┐
└───────────────────────────────────────────┘
┌ ● Portal Klien · update Senin ────────┐
│ (RN) Rina: "Login selesai lebih cepat"│
│ 4 task selesai · 1 file · 68% (+12)   │
└───────────────────────────────────────┘
```

### Project detail (Phase 2)

- Header unchanged. Tabs: Ringkasan · Aktivitas (new) · Milestone · File.
- Ringkasan opens with the latest update/note, then the per-project insights, then today's delivery timeline and schedule panels.
- Aktivitas: the grouped feed, newest first, "Sejak kunjungan terakhir Anda" divider, paged (20 per page, "Muat lebih banyak").

### In-app bell (Phase 3)

- Bell in the `AppShell` header with an unread badge (max "9+"). The list is the viewer's "baru" activities across projects, excluding their own actions.
- Refetch every 60 s and on window focus (React Query). Clicking an item deep-links and marks that project seen. "Tandai semua dibaca".
- PM nudge: on Friday, a staff member with `project:manage` sees "Belum ada catatan minggu ini untuk <project>" if they posted none.

### Email (Phase 4)

- Immediate: a milestone enters awaiting approval → the org's approvers get an email with a "Tinjau" button (same deep link).
- Reminders: still awaiting after 3 days, then 7 days. Then stop.
- Weekly digest: Monday 08:00 WITA, one email per user covering all their projects, built from the weekly updates.
- One-click unsubscribe per type (approval, digest). No per-task emails, ever.
- **Open dependency:** the API has no recipient list. Access tokens carry only `sub` + org claims (`monexa-auth/src/oidc/provider.ts`), with no email. Phase 4 needs `monexa-auth` to expose org members' emails to the API (a machine-to-machine endpoint, or an email claim plus a locally recorded members table), plus an email provider and the scheduler. This gets its own design before Phase 4 starts.

## Constraints

- `@mono/ui` components only (`Avatar`, `StatusLabel`, `Tooltip`, `GrowFill`, `CountUp`, `DynamicModal`, `Skeleton`, `TabBar`…). Anything missing gets added to mono-ui first, not hand-rolled in the app.
- Every BE query is scoped by `org_id`. Server Actions only on the FE. Indonesian copy, works at 360 px, skeleton loading.
- Coverage: 80% in the app; the existing repos' thresholds stay.

## Left to the builder

Exact endpoint paths and response shapes; the grouping implementation; sparkline rendering (`@mono/ui/charts` vs a tiny SVG); copy for each activity type; how the cron endpoint is secured beyond a shared secret.

## Critical files

- API: `project-tracker-api/src/db/schema/projects.ts` (new tables), `src/features/*/service.ts` (write activities), new `src/features/activities/`, `src/features/notes/`, `src/features/insights/`, `vercel.json` (cron).
- FE: new `features/home/`, `features/project-detail/components/{overview-tab,activity-tab}.tsx`, `features/project-detail/helpers/schedule.ts` (reuse for the forecast wording), `app/page.tsx` (client landing), `features/app-shell/components/app-shell.tsx` (bell, Phase 3).
- Reuse: `callerOf()` (`src/auth-context.ts`), the internal-task filtering in `src/features/projects/progress.ts`, `useModalParam` deep links, `APPROVAL_MODAL`, `DeliveryTimeline`.

## Verification

- API: service tests that every change writes exactly one activity in the same transaction; a client never receives an `is_internal` row (feed, counts, insights); last-seen and grouping rules; forecast thresholds (< 7 snapshots, velocity 0).
- FE: component tests for home sections and empty states, the "baru" divider, deep link into the approval modal, and a 360 px render. `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build`.
- Manual: run the API + `pnpm dev`, act as PM (complete tasks, post a note), then as client: home shows the action, insight and "baru"; opening the project clears it after 3 s.
