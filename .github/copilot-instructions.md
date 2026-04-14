# Copilot Instructions for zardonic-industrial

## Project Overview

This is a TypeScript + React (Vite) project deployed on **Vercel**. Serverless functions live in the `api/` directory and use the `@vercel/node` runtime. Type definitions are centralised in `src/lib/types.ts`. Admin UI components are in `src/components/admin/`.

## Feature Sync Rule ⚠️

**When adding OR removing ANY feature, ALL of the following layers MUST be updated in the same PR:**

1. **Types** (`src/lib/types.ts`) — Add/remove the relevant type fields from the appropriate interface.
2. **Admin UI** (`src/components/admin/`) — Add/remove the corresponding admin panel controls that expose the feature to the site owner.
3. **Components** (`src/components/`) — Add/remove the component logic that consumes and renders the feature.
4. **API routes** (`api/`) — Add/remove any server-side endpoints required by the feature.
5. **Utility modules** (`src/lib/`) — Add/remove any helper functions or utilities used by the feature.

**Never** leave orphaned UI controls, type definitions, or utility functions for features that have been removed.  
**Never** add a feature without its corresponding admin UI controls (so the site owner can configure it).

Violating the Feature Sync Rule will be treated as a blocking review issue.

## File Upload (Vercel Blob)

- **Server-side streaming upload**: use `put()` from `@vercel/blob` (NOT `/client`) in `api/cms/video-upload.ts`.
  - The endpoint streams the raw request body directly to Blob storage — no buffering, supports large files.
  - Client sends the file as the raw `POST` body via `XMLHttpRequest` with custom headers:
    - `x-blob-pathname` — the desired storage path (e.g. `videos/timestamp-filename.mp4`)
    - `Content-Type` — the video MIME type (`video/mp4` or `video/webm`)
  - The API endpoint requires `export const config = { api: { bodyParser: false } }` to disable Vercel's body parser.
  - Example server call: `put(pathname, req, { access: 'public', contentType, token: process.env.BLOB_READ_WRITE_TOKEN })`
  - Example client call (in `src/cms/hooks/useVideoUpload.ts`):
    ```typescript
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/cms/video-upload')
    xhr.withCredentials = true
    xhr.setRequestHeader('x-blob-pathname', pathname)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
    ```
  - This eliminates all CORS issues — the upload goes through the project's own API (`'self'`), not `vercel.com/api/blob/`.
  - Do **NOT** use `@vercel/blob/client`'s `upload()` — it routes uploads through `vercel.com/api/blob/` which causes CORS errors.

## TypeScript Strict Mode

This project uses **strict TypeScript**. Implicit `any` types are a compile error. Every function parameter and binding element must be explicitly typed, including callback parameters in `handleUpload`:

```typescript
onBeforeGenerateToken: async (_pathname: string) => { ... }
onUploadCompleted: async ({ blob }: { blob: { url: string } }) => { ... }
```

Never use `any` — always provide explicit types for all parameters, return values, and API responses.

## Build & Quality Checks

Before opening or merging a PR, always run and fix all errors in:

```bash
npm run lint     # ESLint — must produce 0 warnings and 0 errors
npm run build    # Vite + tsc — must complete with 0 errors
npm run test     # Vitest — all tests must pass
```

## Architecture Conventions

- All z-index values use CSS custom properties from `src/layers.css` — never use raw numbers.
- Every page must use `PageLayout` from `src/layouts/PageLayout.tsx` as its top-level layout.
- Admin panel mutations go through `dispatchAdminAction` from `src/lib/admin-action-registry.ts`.
- New CMS fields must be registered in `FIELD_REGISTRY` in `src/cms/schemas.ts`.
- New admin section fields must be added as `SectionConfigField` entries in `SECTION_REGISTRY` in `src/lib/sections-registry.ts`.
- Any admin dialog or panel root element must carry `data-admin-ui="true"` to isolate typography variables.
