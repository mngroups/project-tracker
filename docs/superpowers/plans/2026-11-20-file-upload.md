# File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shared uploader: a headless `useUploadQueue` hook (`@mono/hooks/upload`), a `FileUploadDropzone` component (`@mono/ui/file-upload`), `FormData` support plus the presign contract in `@mono/auth`, and a template guide.

**Architecture:**
- The browser never talks to the BE. A presign Server Action returns an `UploadTarget`, the hook transfers the file directly to storage over XHR (with progress and abort), and the app's own commit Server Action sends the `uploadId`s.
- The dropzone is controlled `File[]` UI that renders the queue's per-file state.
- Packages depend only downward: `@mono/ui` → `@mono/hooks`. `@mono/auth` shares only structural types with `@mono/hooks`.

**Tech Stack:** React 19, TypeScript, Vitest + RTL (jsdom), Biome, Zod v4, Next 16 (template only).

**Spec:** `docs/superpowers/specs/2026-11-20-file-upload-design.md` — read it before any task.

**Repos (siblings under `/Users/muhamad.irfan/PERSONAL/MONEXA/`):** `mono-hooks`, `mono-auth`, `mono-ui`, `monexa-app-template`. None has a commit yet, and the user has not asked for commits. **Do not commit.** Each task ends with a verification checkpoint instead.

## Global Constraints

- Coverage 100% (lines/branches/functions/statements) in every repo. `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` must pass in each touched repo.
- Tests live in `__tests__/` next to the file under test. Package sources use `.js` extensions in relative imports.
- No native `<button>`: use `PlainButton` (pass `type="button"`) or `Button`. Compose classes with `cn()` from `@mono/utils`, never string `+`.
- Copy is Indonesian, verbatim from the spec:
  - "Klik untuk unggah dan pilih dokumen atau seret file ke sini"
  - "Maksimal {n} file."
  - "Ukuran file melebihi batas maksimal {n} MB."
  - "Format file tidak didukung. Harap upload file {exts}."
  - "Gagal mengunggah {nama file}. Silakan coba lagi."
  - "Ulangi", "Ganti", "Lihat"
- No spinners. Pending states use `Skeleton` or the progress bar.
- Responsive at 360px wide, with no horizontal scroll.
- `@mono/hooks` gains no new dependencies. `@mono/hooks/upload` is `"use client"`.
- After changing a package, run `pnpm build` in it, then `pnpm install` in each consumer, to refresh the injected copy.

## Review Focus

1. **The same file picked twice, or two files with the same name and size.** Expected: the dropzone renames the second one (`laporan (1).pdf`), so `fileKey`s never collide and both upload. Test lives in Task 4 (`renames duplicate names so keys stay unique`).
2. **A file removed from the form mid-upload.** Expected: its XHR is aborted and it is absent from `uploadAll()`'s result. No error toast. Test lives in Task 2 (`sync aborts and drops removed files`).
3. **Presign fails for one file out of three.** Expected: that row shows the error with "Ulangi", the others finish, and `uploadAll()` rejects. After a retry succeeds, `uploadAll()` resolves with all three. Test lives in Task 2 (`retry after a presign error re-presigns and completes`).
4. **Dead session during presign in `onSelect` mode.** Expected: the redirect error is thrown during render, never shown as a row error. Test lives in Task 2 (`rethrows NEXT_REDIRECT during render`).
5. **A presigned URL signed for a specific content type.** Expected: the PUT sends exactly that `Content-Type`, even when `file.type` differs or is empty. Test lives in Task 1 (`uses the content-type pinned in the URL`).

---

### Task 1: `@mono/hooks/upload` — types, `fileKey`, `xhrTransport`

**Files:**
- Create: `mono-hooks/src/upload/types.ts`, `mono-hooks/src/upload/file-key.ts`, `mono-hooks/src/upload/xhr-transport.ts`
- Test: `mono-hooks/src/upload/__tests__/xhr-transport.test.ts`, `mono-hooks/src/upload/__tests__/file-key.test.ts`

**Interfaces:**
- Produces (exact, from the spec §1): `UploadTarget`, `UploadTransport`, `UploadStatus`, `UploadItem`, and `UploadedFile` in `types.ts`; `fileKey(file: File): string` returning `` `${name}:${size}:${lastModified}` ``; and `xhrTransport: UploadTransport`.

- [ ] **Step 1: Write the failing tests.** Install a fake `XMLHttpRequest` with `vi.stubGlobal`. It records `open(method, url)`, `setRequestHeader`, and `send(body)`, and exposes `upload.onprogress`, `onload`, `onerror`, `onabort`, `status`, and `abort()`. Tests:
  - `PUTs the raw file when there are no fields`: method `PUT`, body `=== file`.
  - `POSTs FormData with the fields first and the file last when fields are set`: method `POST`. The `FormData` entries are in field order, followed by `["file", file]`.
  - `honours an explicit method`.
  - `uses the content-type pinned in the URL`: for `https://s3/x?Content-Type=image%2Fpng` with a file of type `""`, the header is `Content-Type: image/png`. A lowercase `content-type` param works too.
  - `falls back to file.type, and sends none for an empty type on a POST`.
  - `target.headers override the computed headers`.
  - `reports progress`: `upload.onprogress({ loaded: 5, total: 10, lengthComputable: true })` calls `onProgress(5, 10)`.
  - `rejects with the Indonesian message on non-2xx and on network error`: the message is exactly `Gagal mengunggah a.pdf. Silakan coba lagi.`
  - `aborts when the signal aborts, rejecting with an AbortError`: `name === "AbortError"`. An already-aborted signal never calls `send`.
  - `fileKey` returns `"a.pdf:3:1700000000000"`.

- [ ] **Step 2: Run** `pnpm vitest run src/upload` in `mono-hooks`. Expected: FAIL (modules missing).

- [ ] **Step 3: Implement** `types.ts`, `fileKey`, and `xhrTransport(target, file, { signal, onProgress }): Promise<void>`. The method is `target.method ?? (target.fields ? "POST" : "PUT")`. Read the content type from `new URL(target.url).searchParams` (`content-type`, then `Content-Type`); if the URL is invalid, fall back to `file.type`. Set no `Content-Type` on a POST, since the browser adds the multipart boundary. 2xx means `status >= 200 && status < 300`.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Checkpoint:** `pnpm lint && pnpm typecheck` in `mono-hooks`. Expected: clean.

---

### Task 2: `useUploadQueue` + `@mono/hooks/upload` subpath

**Files:**
- Create: `mono-hooks/src/upload/use-upload-queue.ts`, `mono-hooks/src/upload/index.ts`
- Modify: `mono-hooks/package.json` (add an `"./upload"` export, mirroring `"./form-draft"`), `mono-hooks/README.md` (new `@mono/hooks/upload` section)
- Test: `mono-hooks/src/upload/__tests__/use-upload-queue.test.tsx`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: `useUploadQueue(options: { mode: "onSelect" | "onSubmit"; presign: (file: File) => Promise<UploadTarget>; transport?: UploadTransport; concurrency?: number }): { items: Record<string, UploadItem>; sync(files: File[]): void; uploadAll(): Promise<UploadedFile[]>; retry(key: string): void; cancel(key: string): void; reset(): void; isUploading: boolean; hasErrors: boolean }`.
- `index.ts` exports `useUploadQueue`, `xhrTransport`, `fileKey`, and every type from Task 1.

- [ ] **Step 1: Write the failing tests** with `renderHook`. Use a controllable fake transport (each call returns a deferred; record calls) and a `presign` mock returning `{ uploadId: "u-"+file.name, url: "https://s3/x" }`. Tests:
  - `onSubmit: sync adds idle items and never presigns`: after `sync([a, b])`, both are `idle` with progress `0`, and presign has 0 calls.
  - `onSubmit: uploadAll presigns per file at transfer time and resolves with uploadIds`: resolves to `[{ file: a, uploadId: "u-a.pdf" }, …]` in input order. Statuses are `done` and progress is `1`.
  - `onSelect: sync starts uploads immediately; uploadAll waits for in-flight ones without restarting them`: transport is called once per file in total.
  - `respects concurrency`: with `concurrency: 2` and 3 files, only 2 transports are in flight until one settles. The default is 3.
  - `progress updates the item`: `onProgress(5, 10)` sets progress to `0.5`.
  - `sync aborts and drops removed files`: the removed file's transport signal is `aborted`, it is gone from `items`, and it is absent from `uploadAll()`.
  - `cancel marks canceled, aborts, and excludes it from uploadAll`.
  - `presign error → item error with the action's message; uploadAll rejects`: the message comes via `getErrorMessage` from `@mono/utils`.
  - `transport error → item error with its message`.
  - `retry after a presign error re-presigns and completes`: presign is called twice for that file, and `uploadAll()` then resolves.
  - `rethrows NEXT_REDIRECT during render`: presign rejects with `Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/logout" })` in `onSelect`. Wrap in an error boundary and assert it caught that exact error, and that no item has `status: "error"`. In `onSubmit`, `uploadAll()` also rejects with it.
  - `unmount aborts everything in flight`.
  - `reset aborts and clears`.
  - `isUploading / hasErrors reflect items`.

- [ ] **Step 2: Run** `pnpm vitest run src/upload`. Expected: the new tests FAIL.

- [ ] **Step 3: Implement** `useUploadQueue` in `use-upload-queue.ts`.
  - Keep per-file `AbortController`s and a pending queue in refs, and `items` in state.
  - Redirect errors (digest starts with `NEXT_REDIRECT`; a local one-line check, no `@mono/auth` import) go to a `redirectError` state that the hook body throws.
  - `uploadAll` returns a promise that settles once every non-canceled item is `done` (resolve) or any is `error` (reject with an `Error` carrying the first item's message).

- [ ] **Step 4: Run** `pnpm test:coverage` in `mono-hooks`. Expected: PASS at 100%.

- [ ] **Step 5: Checkpoint:** `pnpm lint && pnpm typecheck && pnpm build` in `mono-hooks`. Expected: clean. `dist/upload/index.js` exists, and `dist/upload/use-upload-queue.js` starts with `"use client";`.

---

### Task 3: `@mono/auth` — `FormData` bodies and the presign contract

**Files:**
- Modify: `mono-auth/src/server/api-client.ts` (Content-Type header)
- Create: `mono-auth/src/upload.ts`
- Modify: `mono-auth/src/index.ts` (export `presignResponseSchema`, `toUploadTarget`, `type PresignResponse`), `mono-auth/README.md`
- Test: `mono-auth/src/server/__tests__/api-client.test.ts` (add cases), `mono-auth/src/__tests__/upload.test.ts`

**Interfaces:**
- Produces:
  - `presignResponseSchema` (zod): `{ upload_uuid: string; s3_key?: string | null; presign_url: string; fields?, presign_fields?, post_fields?: Record<string, unknown> | null }`.
  - `toUploadTarget(data: PresignResponse): { uploadId: string; url: string; fields?: Record<string, string> }`. It is structurally assignable to `UploadTarget`; do not import `@mono/hooks`.

- [ ] **Step 1: Write the failing tests:**
  - `api-client`: `sends FormData without a JSON Content-Type`. The request's `body` is the same `FormData`, and the `Content-Type` header is undefined.
  - `api-client`: `retries a FormData request after a 401 refresh with the same body`.
  - `upload`: `maps fields | presign_fields | post_fields (first non-empty wins), stringifies values, drops nulls`. For example `{ a: 1, b: null }` becomes `{ a: "1" }`.
  - `upload`: `omits fields when none or empty`.
  - `upload`: `schema accepts the BE shape and rejects a missing presign_url`.

- [ ] **Step 2: Run** `pnpm vitest run` in `mono-auth`. Expected: the new tests FAIL.

- [ ] **Step 3: Implement.**
  - In `createApiClient`, include `"Content-Type": "application/json"` only when `!(init.body instanceof FormData)`. Nothing else changes.
  - Add `presignResponseSchema` and `toUploadTarget` in `src/upload.ts`.
  - README: a "Uploads" subsection with the presign Server Action example from the spec §4.

- [ ] **Step 4: Run** `pnpm test:coverage`. Expected: PASS at 100%.

- [ ] **Step 5: Checkpoint:** `pnpm lint && pnpm typecheck && pnpm build` in `mono-auth`. Expected: clean.

---

### Task 4: `@mono/ui/file-upload` — helpers, rows with upload state, multiple dropzone

**Files:**
- Create in `mono-ui/src/file-upload/`:
  - `validate-file.ts`: ported verbatim from `mining-ops-fe/components/file-upload-dropzone/validate-file.ts`, minus `fileKey`.
  - `upload-state.tsx`: progress bar, error with "Ulangi", cancel, done check.
  - `preview-file-list.tsx`: ported. `FilePreviewer` is loaded with `React.lazy` + `Suspense` (`Skeleton` fallback), not `next/dynamic`.
  - `multi-file-dropzone.tsx`: ported.
  - `types.ts`
- Modify: `mono-ui/package.json`
  - Add a `"./file-upload"` export, mirroring `"./file-previewer"`.
  - Set `pnpm.overrides["@mono/hooks"]` to `link:../mono-hooks` (already there; verify), so the new subpath resolves.
- Test: `mono-ui/src/file-upload/__tests__/validate-file.test.ts`, `mono-ui/src/file-upload/__tests__/multi-file-dropzone.test.tsx`
- Port the existing tests from `mining-ops-fe/components/file-upload-dropzone/__tests__/` where they cover the same behaviour.

**Interfaces:**
- Consumes: `fileKey`, `UploadItem` from `@mono/hooks/upload`. `PreviewFile`, `formatFileSize`, `FilePreviewer` from `../file-previewer/*.js`. `FileTypeIcon` from `../file-previewer/file-type-icon.js`.
- Produces: `MultiFileDropzoneProps` = the mining props (`value: File[]`, `onChange`, `accept`, `maxSizeMB` default 20, `maxFiles` default 5, `className`, `helperText`, `readOnly`, `testId`, `multiple: true`) + `uploads?: Record<string, UploadItem>`, `onRetry?(key: string)`, `onCancel?(key: string)`. Also `PreviewFileList`, `PreviewFileRow`, `FileRowButton` (mining signatures, rows gaining an optional `upload?: UploadItem` and the two callbacks), `validateFile`, `parseAcceptedExts`, `uniqueFileName`, and `DEFAULT_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png"`.

- [ ] **Step 1: Write the failing tests** (`multi-file-dropzone.test.tsx`):
  - `adds valid files and rejects a wrong extension with the Indonesian message`.
  - `rejects files over maxSizeMB`: "Ukuran file melebihi batas maksimal 1 MB."
  - `stops at maxFiles`: "Maksimal 2 file." The drop area is hidden at the limit.
  - `renames duplicate names so keys stay unique`: two `laporan.pdf` become `laporan.pdf` and `laporan (1).pdf`.
  - `removes a file`.
  - `readOnly hides the drop area and remove buttons`.
  - `shows uploading progress and cancels`: `uploads[key] = { status: "uploading", progress: 0.42, … }` renders a `role="progressbar"` with `aria-valuenow={42}` and the text "42%". Clicking `aria-label="Batalkan unggah {name}"` calls `onCancel(key)`.
  - `shows the error and retries`: the error text is visible, and the "Ulangi" button calls `onRetry(key)`.
  - `shows done`: `aria-label="Terunggah"`.
  - `opens the previewer from "Lihat"`, after the lazy load resolves (`findBy…`).

- [ ] **Step 2: Run** `pnpm vitest run src/file-upload` in `mono-ui`. Expected: FAIL.

- [ ] **Step 3: Implement** the files above.
  - The visuals and classes follow mining's components. Swap `@/lib/utils` for `@mono/utils` and `@/components/ui/plain-button` for `../ui/plain-button.js`.
  - Upload state renders under the row's subtitle. On `max-md`, the progress bar spans the full row width below the name.

- [ ] **Step 4: Run** `pnpm vitest run src/file-upload`. Expected: PASS.

- [ ] **Step 5: Checkpoint:** `pnpm lint && pnpm typecheck` in `mono-ui`. Expected: clean.

---

### Task 5: `@mono/ui/file-upload` — single dropzone with slots, `FileUploadDropzone`, stories and docs

**Files:**
- Create: `mono-ui/src/file-upload/single-file-dropzone.tsx`, `mono-ui/src/file-upload/file-upload-dropzone.tsx`, `mono-ui/src/file-upload/index.ts`, `mono-ui/src/file-upload/file-upload-dropzone.stories.tsx`, `mono-ui/src/docs/hooks/upload-queue.stories.tsx`
- Modify: `mono-ui/README.md` (component list)
- Test: `mono-ui/src/file-upload/__tests__/single-file-dropzone.test.tsx`

**Interfaces:**
- Consumes: Task 4 helpers and `upload-state.tsx`; `useUploadQueue`, `UploadItem`, `fileKey` from `@mono/hooks/upload`.
- Produces:
  - `TransformResult = { file: File; warning?: string } | { error: string }`.
  - `SingleFileDropzoneProps` = `value: File | null`, `onChange(file: File | null)`, `accept` (default `DEFAULT_ACCEPT`), `maxSizeMB` (default 20), `className`, `helperText`, `readOnly`, `testId`, `existingFileName?`, `existingFileUrl?`, `transformFile?(file: File): Promise<TransformResult>`, `preview?(state: { file: File | null; existingFileUrl?: string | null; status: "idle" | "transforming" | "ok" | "warning" | "error" }): ReactNode`, `uploads?: Record<string, UploadItem>`, `onRetry?(key: string)`, `onCancel?(key: string)`. It looks up `uploads[fileKey(value)]`, so it has the same prop shape as the multiple variant and can take the queue's `items` directly.
  - `FileUploadDropzone(props: SingleFileDropzoneProps | MultiFileDropzoneProps)`, switching on `multiple`.
  - `index.ts` exports `FileUploadDropzone`, both prop types, `TransformResult`, Task 4's exports, and re-exports `fileKey` from `@mono/hooks/upload`.

- [ ] **Step 1: Write the failing tests:**
  - `validates like the multiple one and calls onChange(file)`.
  - `transformFile pending shows a skeleton overlay, then onChange(result.file)`: `preview` receives `status` of `"transforming"` and then `"ok"`.
  - `transformFile warning keeps the file and shows the warning`: amber text visible, `onChange(file)` called, `preview` gets `"warning"`.
  - `transformFile error keeps the picked name, shows the error with "Ganti", calls onChange(null)`: `preview` gets `"error"` with `file` set.
  - `a thrown transformFile becomes an error state`.
  - `renders existingFileName when there is no value`.
  - `upload uploading blocks replacing until canceled`: the hidden input is not clicked while uploading, and cancel calls `onCancel`.
  - `upload error shows Ulangi`.
  - `readOnly ignores drops`.
  - `FileUploadDropzone switches on multiple`.

- [ ] **Step 2: Run** `pnpm vitest run src/file-upload`. Expected: the new tests FAIL.

- [ ] **Step 3: Implement.**
  - `single-file-dropzone.tsx`: mining's layout minus the GeoJSON code. The `preview` slot sits where mining rendered `GeoJsonMapPreview`, and warnings and errors use mining's amber and red styles.
  - Stories: single, single with a fake `transformFile` (ok / warning / error), multiple, and multiple with each upload state.
  - `upload-queue.stories.tsx` drives `useUploadQueue` in both modes against a fake transport that ticks progress on a timer.

- [ ] **Step 4: Run** `pnpm test:coverage` in `mono-ui`. Expected: PASS at 100%.

- [ ] **Step 5: Checkpoint:** in `mono-ui`, run `pnpm lint && pnpm typecheck && pnpm build`, then `pnpm storybook:build`. Expected: clean. `dist/file-upload/index.js` exists.

---

### Task 6: Template — guide, CLAUDE.md, consumer smoke test

**Files:**
- Create: `monexa-app-template/docs/guides/file-upload.md`, `monexa-app-template/__tests__/file-upload-smoke.test.tsx`
- Modify:
  - `monexa-app-template/CLAUDE.md`: add the "Need → Use" row `| File upload | FileUploadDropzone (@mono/ui/file-upload) + useUploadQueue (@mono/hooks/upload) |` and link the guide.
  - `monexa-app-template/README.md`: one bullet under "What you get".
- Refresh: `pnpm install` (picks up the rebuilt `@mono/hooks`, `@mono/auth`, `@mono/ui`).

**Interfaces:**
- Consumes: the public exports of Tasks 2, 3 and 5 only.

- [ ] **Step 1: Write the failing smoke test.** It renders `FileUploadDropzone multiple` wired to `useUploadQueue({ mode: "onSelect", presign, transport })`, with a mocked presign and an instantly-resolving transport. Picking a file shows the done state (`aria-label="Terunggah"`). This proves the subpaths resolve in a consumer, through `server.deps.inline`.

- [ ] **Step 2: Run** `pnpm vitest run __tests__/file-upload-smoke.test.tsx`. Expected: FAIL before `pnpm install`, PASS after it.

- [ ] **Step 3: Write `docs/guides/file-upload.md`.** Cover the spec §4 points in this order:
  1. When to pick `onSelect` vs `onSubmit`.
  2. The presign Server Action: `apiClient(path, { method: "POST" }, apiEnvelope(presignResponseSchema))`, then `throwIfFail`, then `toUploadTarget(res.data)`.
  3. Submit wiring: `await uploadAll()`, then the commit action, then invalidate the smallest key prefix.
  4. Multipart via `apiClient` + `FormData` for small files, and when to raise `serverActions.bodySizeLimit`.
  5. Bucket CORS: origin, `PUT`/`POST`, `Content-Type`, expose `ETag`.
  6. Never presign at pick time in `onSubmit` mode.

- [ ] **Step 4: Run** `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` in `monexa-app-template`. Expected: all pass. Biome may reformat the Markdown tables; run `pnpm lint:fix` first.

- [ ] **Step 5: Final check:** re-run the four commands in `mono-hooks`, `mono-auth`, and `mono-ui`. Expected: all pass.
