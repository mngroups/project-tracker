# File upload

Files go **browser → storage** via a presigned URL. The BE is only reached through Server Actions: one to presign, one to commit. The session token never leaves the server, and a large file never passes through a Server Action (1 MB body limit by default).

| Piece                                     | From                   | Role                                                                                      |
| ----------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `FileUploadDropzone`                      | `@mono/ui/file-upload` | Controlled picker (`File` or `File[]`) with per-file progress, error, "Ulangi" and cancel |
| `useUploadQueue`                          | `@mono/hooks/upload`   | Presign → transfer (XHR, progress, abort) → hands you the `uploadId`s                     |
| `presignResponseSchema`, `toUploadTarget` | `@mono/auth`           | The BE presign contract, mapped to what the queue needs                                   |

## 1. Pick a mode

| Mode       | Uploads when                            | Use it for                                                                              |
| ---------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `onSubmit` | the form is saved (`await uploadAll()`) | Small attachments; a form the user often abandons; anything drafted with `useFormDraft` |
| `onSelect` | the file is picked                      | Big files (submit feels instant); single-purpose upload screens                         |

With `onSelect`, a file whose form is abandoned is uploaded but never committed. The BE must expire uncommitted uploads.

## 2. Presign Server Action

```ts
// features/<domain>/actions/<domain>.actions.ts
"use server";

import {
  apiEnvelope,
  presignResponseSchema,
  throwIfFail,
  toUploadTarget,
  wrapServerAction,
} from "@mono/auth";
import { apiClient } from "@/lib/session";

const presignSchema = apiEnvelope(presignResponseSchema);

export async function presignAttachmentAction() {
  return wrapServerAction(async () => {
    const res = throwIfFail(
      await apiClient("/v1/attachments/presign", { method: "POST" }, presignSchema)
    );
    return toUploadTarget(res.data); // { uploadId, url, fields? }
  });
}
```

`wrapServerAction` keeps the BE's Indonesian message intact (Next redacts thrown messages in production) and still lets the dead-session redirect through. Unwrap it on the client:

```ts
const presign = async () => unwrapServerAction(await presignAttachmentAction());
```

## 3. Wire the form

```tsx
const [files, setFiles] = useState<File[]>([]);
const queue = useUploadQueue({ mode: "onSelect", presign });

<FileUploadDropzone
  multiple
  value={files}
  onChange={(next) => {
    setFiles(next);
    queue.sync(next);
  }}
  uploads={queue.items}
  onRetry={queue.retry}
  onCancel={queue.cancel}
/>;

// submit
const uploaded = await queue.uploadAll(); // rejects if any file failed
await createReportAction({ ...values, attachment_uuids: uploaded.map((u) => u.uploadId) });
await queryClient.invalidateQueries({ queryKey: REPORT_KEY });
```

- Disable submit while `queue.isUploading`, and show the rows' errors when `queue.hasErrors`.
- **Call `queue.reset()` whenever the form resets**: after a successful submit and on Batal, next to `clearDraft()`. `uploadAll()` returns every file _in the queue_, so a modal or page that stays mounted would otherwise commit the previous submission's upload IDs again.
- Single variant: `onChange={(file) => { setFile(file); queue.sync(file ? [file] : []); }}`, then pass the same `uploads`, `onRetry` and `onCancel`.
- A canceled file stays in the form marked "Unggahan dibatalkan" and is left out of `uploadAll()`. The user retries it ("Ulangi") or removes it.
- Never presign at pick time in `onSubmit` mode: presigned URLs expire. The queue presigns each file right before its transfer, and `retry` presigns again.
- A dead session during presign is thrown during render, so Next's redirect boundary sends the user to `/logout`. Don't wrap the uploader in an error boundary that swallows `NEXT_REDIRECT`.
- `FileUploadDropzone`'s "Lihat" previewer needs the `QueryClientProvider` the app already mounts.

## 4. Small files through a Server Action

For a small file the BE takes as multipart (an Excel import, say), skip presign:

```ts
"use server";
export async function importFuelAction(formData: FormData) {
  return wrapServerAction(async () =>
    throwIfFail(
      await apiClient("/v1/fuel/import", { method: "POST", body: formData }, importSchema)
    )
  );
}
```

`apiClient` leaves out the JSON Content-Type for `FormData` (fetch adds the multipart boundary) and keeps refresh, 401 retry and auto-logout. Over 1 MB, raise `experimental.serverActions.bodySizeLimit` in `next.config.mjs` for that app only, or switch to presign.

## 5. Bucket CORS

The browser PUTs/POSTs straight to the bucket, so the bucket must allow:

- Origin: every app origin (local, staging, prod)
- Methods: `PUT`, `POST`
- Headers: `Content-Type` (plus any `x-amz-*` the BE signs)
- Expose: `ETag`

When the presigned URL pins a `content-type` query parameter, the upload sends exactly that header; S3 answers `SignatureDoesNotMatch` otherwise.
