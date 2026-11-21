# File upload for Monexa apps — design

Date: 2026-11-20 · Status: draft, awaiting approval

## Intent

Every Monexa app ends up uploading files: attachments on a form, evidence photos, Excel imports, map files. Today that code exists only in `mining-ops-fe`, spread across a dropzone component, `lib/s3-upload.ts`, a `runMapUpload` pipeline, and a hand-written multipart Server Action that re-implements `apiClient`'s auth handling. The template and the shared packages have nothing, so a new app would copy it again.

This work moves the reusable parts into the shared packages, so a new app gets an uploader component and an upload hook out of the box. `mining-ops-fe` can later migrate to them without changing what its users see.

## What exists today (mining-ops-fe, `main` @ 1.3.1-rc.4)

| Piece                                                                                                                                      | Where                                                                         | Reusable?                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FileUploadDropzone` (single / multiple, ext + size validation, `maxFiles`, unique names, preview list with "Lihat", `readOnly`, `testId`) | `components/file-upload-dropzone/`                                            | Yes. The GeoJSON map preview inside the single dropzone (`showMapPreview`, `existingMapUuid`, `previewScope`, `useMapFilePreview`) is domain-specific. |
| Presigned upload: PUT, or POST with form `fields`; Content-Type must match a `content-type` query param on the URL                         | `lib/s3-upload.ts` (`uploadToS3Web`)                                          | Yes. Plain `fetch`, no progress, no cancel.                                                                                                            |
| Native (Capacitor) background upload + offline queue + reconciler                                                                          | `lib/s3-upload.ts`, `lib/offline/*`, `components/native/*`                    | **No — stays in mining-ops-fe** (decided).                                                                                                             |
| Presign → upload → commit pipeline                                                                                                         | `runMapUpload` in `features/boundary-management/hooks/use-area-map-upload.ts` | The shape, yes.                                                                                                                                        |
| BE presign response `{ upload_uuid, s3_key?, presign_url, fields? \| presign_fields? \| post_fields? }`                                    | `presignResponseSchema` in boundary-management schema                         | Yes (BE contract).                                                                                                                                     |
| Multipart Excel upload through a Server Action (`bodySizeLimit: "25mb"`)                                                                   | `features/fuel/actions/fuel-actions.ts`                                       | It bypasses `apiClient` only because `apiClient` forces `Content-Type: application/json`, and it re-implements refresh and 401 handling by hand.       |

## Goals

1. A dropzone component in `@mono/ui` that any app can drop into a form, with per-file upload progress, error, retry and cancel shown on each row.
2. A headless upload hook in `@mono/hooks` that runs presign → upload → (caller's) commit, with per-file state, progress and cancel/retry, in one of two modes:
   - `onSubmit`: files are held as `File[]` and uploaded when the form submits (today's mining-ops-fe behaviour).
   - `onSelect`: each file starts uploading as soon as it is picked; submit only commits the `uploadId`s.
3. `apiClient` (`@mono/auth`) accepts a `FormData` body, so small multipart uploads through a Server Action keep the shared refresh, 401 and auto-logout logic.
4. The template documents how to wire it (`docs/guides/file-upload.md`).

## Non-goals

- Native (Capacitor) background upload and the offline queue. They stay **entirely** in mining-ops-fe, outside the hook. Its map uploads (`runMapUpload`, `useUploadBoundaryMap`) keep their own pipeline: offline they skip presign altogether, and native needs the commit body before the transfer starts, for the kill-recovery reconciler. That doesn't fit a presign-first queue, and bending the hook to it would drag offline jobs and commit payloads into a BE-agnostic package. The `transport` option still lets any app swap the web transfer (e.g. a different HTTP client), but it is not the native/offline integration point.
- Migrating mining-ops-fe in this round. The **dropzone** must be able to reproduce today's mining-ops-fe screens (including the GeoJSON error/warning states) through its slots without behaviour change. The migration itself is separate work.
- Map/GeoJSON preview in the shared dropzone. It becomes a slot that mining-ops-fe fills.
- Persisting in-flight uploads across reloads. `useFormDraft` keeps storing file _names_ only, as today.
- Deleting orphaned uploads. In `onSelect` mode, an uploaded file whose form is abandoned is never committed; cleaning that up is the BE's job.
- Resumable or chunked (multipart S3) uploads.

## Anti-goals (fails even if it "works")

- The session token or any BE call reaching the browser. The browser only ever talks to the presigned storage URL. Presign and commit stay Server Actions.
- `@mono/hooks` gaining a dependency on Capacitor, TanStack Query, or any BE endpoint or response shape.
- A `File` crossing the Server Action boundary for large files. Large files always go browser → storage directly.
- Copy that isn't Indonesian, or a loading state that isn't a skeleton or progress bar.

## Approaches considered

|                                                | When it uploads       | Trade-off                                                                                                                                                              |
| ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Upload on submit only                       | Form submit           | Simplest, and matches mining-ops-fe and `useFormDraft`. But the user waits at the end, and one failed file fails the whole submit.                                     |
| B. Upload on select only                       | When a file is picked | Submit feels instant. But abandoned forms leave orphans, and drafts get harder (`uploadId`s can expire).                                                               |
| **C. Headless queue supporting both (chosen)** | Caller picks `mode`   | Covers mining-ops-fe (`onSubmit`) unchanged and lets new apps choose `onSelect`. Per-file state is needed for progress bars anyway, so the extra API surface is small. |

**Picked: C**, by the user, because it keeps mining-ops-fe's behaviour reachable while letting new apps upload eagerly.

## Design

### 1. `@mono/hooks/upload` (new subpath)

Headless, BE-agnostic, client-only (`"use client"`). No peer dependencies beyond `react`.

```ts
/** Where to send one file. Built by the app from its BE's presign response. */
export type UploadTarget = {
  uploadId: string;               // what the commit sends back to the BE
  url: string;                    // presigned URL
  method?: "PUT" | "POST";        // default: POST when `fields` is set, else PUT
  fields?: Record<string, string>; // POST form fields (S3 presigned POST)
  headers?: Record<string, string>;
};

export type UploadTransport = (
  target: UploadTarget,
  file: File,
  ctx: { signal: AbortSignal; onProgress: (loaded: number, total: number) => void }
) => Promise<void>;

export type UploadStatus = "idle" | "uploading" | "done" | "error" | "canceled";

export type UploadItem = {
  key: string;            // fileKey(file): `${name}:${size}:${lastModified}`
  file: File;
  status: UploadStatus;
  progress: number;       // 0..1
  uploadId?: string;      // set once presigned
  error?: string;         // Indonesian, user-facing
};

export type UploadedFile = { file: File; uploadId: string };

export function useUploadQueue(options: {
  mode: "onSelect" | "onSubmit";
  presign: (file: File) => Promise<UploadTarget>; // wraps the app's Server Action
  transport?: UploadTransport;                    // default: xhrTransport
  concurrency?: number;                           // default 3
}): {
  items: Record<string, UploadItem>;
  /** Mirror the form's File[] (call from the dropzone's onChange). Adds new files
   *  (and in onSelect mode starts them); aborts and drops removed ones. */
  sync: (files: File[]) => void;
  /** Resolves when every current file is uploaded. In onSubmit mode it starts the
   *  pending ones first. Rejects with the first error if any file ends in error. */
  uploadAll: () => Promise<UploadedFile[]>;
  retry: (key: string) => void;
  cancel: (key: string) => void;
  reset: () => void;
  isUploading: boolean;
  hasErrors: boolean;
};

export const xhrTransport: UploadTransport;      // default; exported for wrapping
export function fileKey(file: File): string;
```

Rules the implementation must keep:

- **Commit is not in the hook.** The caller's submit handler calls `await uploadAll()`, then its own commit Server Action with the `uploadId`s. That keeps the hook free of BE shapes and query invalidation.
- **`xhrTransport`** uses `XMLHttpRequest`, because `fetch` cannot report upload progress.
  - With `fields`: POST a `FormData` built from the fields plus `file` appended last.
  - Without `fields`: PUT the raw file.
  - Ported from mining-ops-fe: when the URL carries a `content-type` / `Content-Type` query parameter, send exactly that `Content-Type` header (otherwise S3 answers `SignatureDoesNotMatch`). Otherwise send `file.type` if set. `target.headers` override.
  - The `AbortSignal` aborts the XHR. A non-2xx response or a network/CORS failure becomes a user-facing error: "Gagal mengunggah {nama file}. Silakan coba lagi."
- **Presign happens per file, right before its transfer.** Presigned URLs expire, so the hook must never presign at pick time in `onSubmit` mode. `retry` presigns again.
- A presign rejection shows the action's message (`getErrorMessage` from `@mono/utils`). A `NEXT_REDIRECT` from the presign Server Action (dead session) must never become an item error. Use `isRedirectError` semantics (digest starts with `NEXT_REDIRECT`); `@mono/hooks` duplicates that one-line check rather than depending on `@mono/auth`.
  - Where it goes: the hook stores the redirect error in state and **rethrows it during render**, so Next's built-in redirect boundary navigates. This works the same in both modes, including `onSelect`, where nobody awaits the presign started by `sync()`. In `onSubmit` mode, `uploadAll()` also rejects with it.
  - Verified in Next 16.4.6 (`client/components/router-reducer/reducers/server-action-reducer.js`): an action that redirects **rejects** its promise with the `NEXT_REDIRECT` error. For an internal redirect, that rejection is the only navigation trigger: it happens when the error reaches `RedirectBoundary`. A swallowed redirect therefore never logs the user out, which makes rethrowing during render mandatory.
- Removing a file (via `sync`) or `cancel` aborts its transfer. `canceled` items are excluded from `uploadAll`'s result. In `onSelect` mode, `uploadAll` waits for in-flight items rather than restarting them.
- Unmount aborts everything in flight.

### 2. `@mono/ui/file-upload` (new subpath, next to `./file-previewer`)

Ported from mining-ops-fe's `components/file-upload-dropzone/`, kept visually identical. Exports `FileUploadDropzone` (single | `multiple`), `PreviewFileList`, `PreviewFileRow`, `FileRowButton`, and the helpers `validateFile`, `parseAcceptedExts`, `uniqueFileName`, `DEFAULT_ACCEPT`. `fileKey` is re-exported from `@mono/hooks/upload`, so both packages agree on the key.

Changes from the mining-ops-fe version:

- **Upload state.** New optional props on both variants: `uploads?: Record<string, UploadItem>`, `onRetry?(key)`, `onCancel?(key)`. The type comes from `@mono/hooks/upload`. Without `uploads`, both look exactly as today.
  - Multiple: each row shows its own state.
    - `uploading`: a progress bar and percentage, plus a cancel button.
    - `error`: the message in `text-destructive` and an "Ulangi" button.
    - `done`: a check.
  - Single: the same states render inside the drop area, under the file name, in place of the "Ganti" hint. A file in `uploading` cannot be replaced until it is canceled or finishes.
- **Map preview becomes slots.** The single dropzone drops `showMapPreview`, `existingMapUuid`, `previewScope`, `loadExistingGeoJson` and `useMapFilePreview`, and gains two props:
  - `transformFile?(file): Promise<TransformResult>`, where `TransformResult = { file: File; warning?: string } | { error: string }`. It is awaited before `onChange`, with a skeleton overlay while pending.
    - `{ file }` calls `onChange(file)`.
    - `{ file, warning }` calls `onChange(file)` and shows the warning in amber, with the file kept selected.
    - `{ error }` keeps the picked file's name on screen, shows the error in red with a "Ganti" button, and calls `onChange(null)`.
    - A thrown error is treated as `{ error: getErrorMessage(e) }`.
  - `preview?: (state: { file: File | null; existingFileUrl?: string | null; status: "idle" | "transforming" | "ok" | "warning" | "error" }) => ReactNode`. This render prop is always called inside the drop area, so it can render on error too.
  - mining-ops-fe rebuilds today's GeoJSON preview, including its error and warning screens, on these two props. `existingFileName` and `existingFileUrl` stay.
- No `next/dynamic` and no `@squantumengine/horizon`. Load `FilePreviewer` with `React.lazy` + `Suspense`, with a `Skeleton` fallback. `@mono/ui` exports no `Spinner`, and spinners are out anyway: every pending state uses `Skeleton` or the progress bar.
- Copy unchanged (Indonesian), e.g. "Klik untuk unggah dan pilih dokumen atau seret file ke sini", "Maksimal {n} file.", "Ukuran file melebihi batas maksimal {n} MB."
- Mobile: rows and the drop area must fit at 360px with no horizontal scroll, and the progress bar sits below the file name on narrow widths.
- A Storybook story covers single, multiple, and multiple with each upload state. A docs page under the existing "Hooks" section covers `useUploadQueue` with both modes, against a fake transport.

### 3. `@mono/auth`

- **`apiClient` accepts `FormData`.** When `init.body` is a `FormData`, it must not set `Content-Type` (the runtime adds the multipart boundary). Everything else stays: bearer token, up-front refresh, one 401 refresh + retry, auto-logout, schema validation. The retry re-sends the same `FormData`, which is safe because a Server Action has already buffered it.
- **BE presign contract in the root entry** (client-safe):
  - `presignResponseSchema`: `{ upload_uuid, s3_key?, presign_url, fields? | presign_fields? | post_fields? }`, with field values coerced to strings and nulls dropped.
  - `toUploadTarget(data): UploadTarget-compatible object`, a structural match for `@mono/hooks`' type with no import between the packages.

### 4. Template (`monexa-app-template`)

- `docs/guides/file-upload.md` covers:
  - The two modes, and when to pick each.
  - The presign Server Action pattern (`apiClient` + `apiEnvelope(presignResponseSchema)` → `toUploadTarget`).
  - Submit wiring (`await uploadAll()` → commit action → invalidate).
  - Multipart via `apiClient` + `FormData`, for small files only.
  - Bucket CORS requirements: allow the app origin, `PUT`/`POST`, `Content-Type`, and expose `ETag`.
- CLAUDE.md "Need → Use" table gets a "File upload" row pointing at `FileUploadDropzone` + `useUploadQueue`.
- `next.config.mjs` stays at the default 1 MB Server Action body limit. The guide says to raise `serverActions.bodySizeLimit` only for an app that genuinely needs multipart through a Server Action.
- No change to the `example` feature: the reference BE has no upload endpoint (my call; see below).

## Constraints

- Coverage stays 100% in every package. XHR is tested with a fake `XMLHttpRequest`, not the network.
- Biome rules: no native `<button>` (`PlainButton` / `Button`), `cn()` for classes.
- `@mono/hooks/upload` must work in jsdom tests of consumer apps (`server.deps.inline` already covers `@mono/*`).
- Release order: `@mono/hooks` → `@mono/auth` → `@mono/ui` (`@mono/ui` imports the type and `fileKey` from `@mono/hooks/upload`). Then the template.

## Calls I made (correct any)

- Commit stays out of the hook (BE-agnostic, and keeps invalidation in the app).
- `fileKey` lives in `@mono/hooks/upload`; `@mono/ui` re-exports it.
- Presign per file at transfer time, never at pick time.
- Default concurrency 3.
- The presign contract helper lives in `@mono/auth` (the BE-contract package), not `@mono/hooks`.
- The template gets a guide, not a wired example, because the example BE has no upload endpoint.
- Native/offline is not hosted by the hook at all (follows "tinggal saja"). mining-ops-fe's map pipeline stays as is.
- A dead-session redirect from presign is rethrown during render (required: Next 16 navigates only when the rejection reaches `RedirectBoundary`).
- `transformFile` returns `{ file, warning? } | { error }`, and `preview` is a render prop that also renders on error, so mining's GeoJSON screens can be rebuilt unchanged.
- Single mode shows upload state inside the drop area.

## Left to the builder

- Internal state structure of the queue (reducer vs. refs), and how `sync` diffs.
- The exact progress-row layout within the existing row look.
- Story and test file organisation.
