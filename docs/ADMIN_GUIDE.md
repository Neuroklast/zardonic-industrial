# Admin Guide

> **Last updated:** 2026-08-29

The admin panel is at **`/admin`**. Sign in at **`/admin/login`** with a Supabase user that has `profiles.role = 'admin'`.

## Sign-in

Use the email/password form (native POST to the server route). Do not use browser-side Supabase sign-in for admin — it causes cookie race issues. See [agent/security.md](./agent/security.md).

## Navigation

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin` | Overview |
| Site Config (Look & Feel) | `/admin/site-config` | Hero, background, appearance, footer URLs + **live preview** |
| Legal & Privacy | `/admin/legal` | Operator details, privacy policy override |
| Biography | `/admin/bio` | Bio text |
| Gallery | `/admin/gallery` | Images |
| Media Downloads | `/admin/media` | Press photos, logos, PDFs, ZIPs, audio |
| Discography | `/admin/releases` | Releases + sync |
| Events | `/admin/gigs` | Gigs + Bandsintown sync |
| Newsletter | `/admin/newsletter` | Subscribers |
| Data | `/admin/data` | Import/export + **data maintenance** |

Full nav is in `app/admin/_config/nav-groups.ts`.

## Media downloads

`/admin/media` publishes files on the homepage **Media** section and `/media`.

- Allowed: JPEG, PNG, WebP, GIF (preview + overlay), PDF/ZIP (direct download), MP3/WAV (inline player).
- Files are stored **as uploaded** in R2 — no crop/WebP conversion.
- Category (`photo` / `logo` / `document` / `audio` / `other`) is a filter on `/media`; click behaviour follows the file type.
- After adding the `media_downloads` table in Supabase (`supabase/schema.sql`), new section `media` appears in Look & Feel → Sections (existing sites: at the end of the list until you reorder).

## Look & Feel live preview

On **Site Config**, the split preview pane:

| Control | What it does |
|---------|----------------|
| **Editor only / Split preview** | Hide or show the public site iframe |
| **Desktop / Mobile** | Mobile constrains the iframe to **390px** so CSS media queries match a phone (hero mobile width, mobile nav, etc.) without resizing the admin window |
| **Refresh** | Reload the iframe and re-broadcast drafts |
| **New tab** | Open `/?adminPreview=1` full size |

Draft edits (hero, theme, background, …) appear in the preview **before Save**. Production only updates after **Save** (~60s cache revalidate).

## Hero wordmark

**Look & Feel → Hero** (`site_config.hero`):

| Field | Notes |
|-------|--------|
| Wordmark image | PNG/WebP with transparency; upload large sources (≥2000px) for sharp large sizes |
| **Desktop width %** | Width of content column on `md+` (15–100); height follows aspect ratio |
| **Mobile width %** | Separate phone width (often 85–100%). One % cannot look right on both breakpoints |
| Boot sequence | Optional ~1.1s filmic entrance when the hero is on-screen |
| Background overlay | Optional full-bleed image behind the wordmark only |

If mobile width was never saved, the public site uses `max(desktop, 90%)` so phones still fill nearly full content width.

## Background (image + video)

**Look & Feel → Background** (`site_config.background`):

| Control | Behaviour |
|---------|-----------|
| Background image | Static layer with opacity; shown only when **no** video is active for that viewport |
| Desktop video ON/OFF | Master switch — off keeps the file but shows the image instead |
| Mobile: Same / Separate / No video | “No video on mobile” uses the background image on phones while desktop can keep video |

When video is playing, the image is not rendered underneath (no double-opacity stack).

## Legal & Privacy (`/admin/legal`)

Stored in Supabase `site_config.legal`:

- **Operator identity** — name, street, ZIP+city, country, phone, email, VAT ID (injected into `/legal-notice` and `/privacy-policy` without editing full legal text)
- **Editorial responsibility** — optional; defaults to operator
- **Privacy policy** — optional full-text override; empty = built-in GDPR template
- **Footer URLs** — Site Config → Footer & Legal: `legalNoticeUrl`, `privacyPolicyUrl`

Public pages: `/legal-notice`, `/privacy-policy`.

## Site configuration

`site_config` keys include `hero`, `appearance`, `background`, `sections`, `footer`, `newsletter`, `legal`, `analytics`, etc. Changes revalidate public pages within ~60s (`revalidate` on `app/page.tsx`).

## Media uploads

Images and video upload to **Cloudflare R2** via admin upload actions. URLs are stored as `*_storage_path` columns with optional legacy URL fallbacks. Replacing a file (new upload or remote import) **deletes the previous R2 object** automatically once the new upload succeeds; use **Clear selection** only to drop the form field without deleting storage.

**Images (crop → upload):** The crop editor exports **WebP** (not full-res PNG) and the Server Action body limit is **4 MB** (`next.config` `experimental.serverActions.bodySizeLimit`). Source files may be up to 10 MB before crop; after export the payload must stay under ~3.5 MB. If upload fails with React error **#441** or **413**, the crop export was almost certainly too large for the previous 1 MB default — retry after deploy, or use a smaller source. Hero crops export at **source resolution** (up to 4096px), not the editor viewport size.

### R2 bucket CORS (browser uploads)

**Images** upload via a Server Action (`uploadOptimizedImage` → `uploadBufferToR2`), which PUTs to R2 **from the server** — no browser CORS involved.

**Video, and downloadable media** (`/admin/media`, press-kit), upload **from the browser** to a presigned R2 PUT URL (`createSignedUploadUrl` / `useR2MultipartUpload`). A cross-origin `PUT` with a `Content-Type` header triggers a browser **preflight OPTIONS** to `*.r2.cloudflarestorage.com`. If the bucket has no matching CORS rule the upload fails with `net::ERR_FAILED` / "failed to fetch", **even though the presigned URL is valid.**

The target bucket is **resolved server-side** from `R2_BUCKET_MEDIA` inside `createSignedUploadUrl(objectKey)` — the client never dictates the bucket, and must not be trusted to (client components read `MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'`, and `process.env` is unavailable in the browser bundle, so it always falls back to the hardcoded default — which typically has no CORS rule). If browser PUTs report a CORS/`Access-Control-Allow-Origin` failure, confirm the running deployment's `R2_BUCKET_MEDIA` actually points at the bucket that has the CORS policy; changing the env var requires a **new build** (Vercel applies env changes only on the next deploy).

**Object keys are content-addressed** (`lib/r2-object-key.ts`): `${prefix}/<sha256>.${ext}`. Same content → same key, so media survives an R2 bucket move (only the host changes, rewritten at render time). Replacing a file with different bytes yields a different key and the previous object is deleted; re-uploading the same bytes is idempotent (nothing orphaned).

**After a bucket move, references self-repair automatically (no Pro tier needed):**
1. Every **Production deploy** runs the reconcile at serverless boot (once per git SHA) via `instrumentation.ts` — it rewrites stale host/path and now matches by **content hash**, plus backfills the `content_hash` columns.
2. On a live 404, the public `<img onError>` calls `/api/media-fix`, which finds the object by content hash in the live bucket and swaps to the corrected URL.
3. Manual: `/admin/data → Match files in current R2 bucket`.

The old hourly `cron` for this was removed — Vercel Cron Jobs need Pro. If you keep the optional GitHub `deployment_status` hook, it needs a `CRON_SECRET`. Confirm `/admin/health` shows the new `R2_PUBLIC_HOST` and the **R2 bucket CORS** row is OK.

The bucket must allow the admin origin to `PUT` (and expose `ETag` for multipart reads). See [`r2-cors.json`](../r2-cors.json). Apply via Cloudflare Dashboard → **R2 → bucket → Settings → CORS Policy** (or `npx wrangler r2 bucket cors set <BUCKET> --file r2-cors.json`). R2 does **not** honour the S3 `PutBucketCors` API — use the dashboard / Wrangler / REST API.

- Locked origins are safer than `*`, but Vercel preview URLs change per deploy; a private media bucket reached only via presigned URLs is safe with `"AllowedOrigins": ["*"]`. Add `http://localhost:3000` for local dev.
- After editing CORS, purge the R2 **custom-domain** cache (if you serve via a custom domain) so cached responses pick up the new headers.
- `/admin/health` shows a **R2 bucket CORS** row (read-only via `GetBucketCorsCommand`) so you can confirm a policy is present before uploading video.

## Data export / import (`/admin/data`)

**Download JSON** saves a full editorial backup: every release (including manually edited tracklists and copy), news posts (drafts included), gigs, gallery, bio, partners, social links, merch, soundpacks, music highlights, and all Look & Feel / legal / translation keys in `site_config`. Inactive rows are included. API secrets and newsletter subscribers are not.

**Import JSON** upserts that file by id/key. It does not delete extra rows already in the database. Export before a purge or catalogue re-sync.

**Match files in current R2 bucket** (after a Vercel / Supabase / R2 account move): Preview then **Reconcile now**. Lists objects in the live bucket and updates stored URLs / `storage_path` when the **filename or content hash** uniquely matches — including percent-encoded `wsrv.nl/?url=https%3A%2F%2F…`, re-uploads that dropped folder prefixes, and rows that changed prefix **and** basename. Duplicate filenames are skipped (shown as ambiguous); matched rows also backfill their `content_hash` column. Does **not** copy files. Confirm `/admin/health` shows the new `R2_PUBLIC_HOST`. Hard-refresh afterwards.

Production deploys run this automatically (once per commit, at serverless boot — no cron/Pro tier). Optional extra hook: `POST /api/r2-reconcile` with `Authorization: Bearer CRON_SECRET`. Public `<img onError>` calls `/api/media-fix` to self-heal a miss on the fly.

### Factory reset (irreversible)

`/admin/data` → **Factory Reset** wipes **all** editable content (releases, gigs, gallery, news, partners, merch, soundpacks, media downloads, bio, social links) and restores the default `site_config` values. This is a full revert to a clean site.

Safeguards (all must pass before the reset runs):
1. Download a backup first — the button stays disabled until **"I have downloaded a current backup first"** is ticked.
2. Type the exact phrase `zardonic-factory-reset` to arm.
3. Optional checkbox to also **delete all R2 media files** (leave unticked to keep uploaded files).
4. Final confirmation dialog.

Server-side, the action is `factory_reset` (expert disclosure, admin-session-gated) and it rejects if the confirmation phrase does not match — nothing is touched before that check. Preserved: Supabase secrets, newsletter subscribers, analytics events, sync jobs, and the R2 reconcile marker. `legal` identity is reset to empty, so re-enter privacy info after a reset.

**Data Maintenance** panel (below export/import) links to Catalogue Sync:

| Action | Effect |
|--------|--------|
| Enrich all tracklists | Fetches missing/stale tracklists (Spotify → Discogs → iTunes) + Odesli platform links for non-manual releases |
| Reset tracklists | Clears `tracks` on auto-synced releases (keeps `manually_edited`) |
| Purge + sync releases | **Hard reset**: deletes **every** release (manually edited included), re-imports Spotify catalogue so the list matches Spotify exactly, enriches tracklists |
| Purge + sync gigs | Deletes all gigs, runs Bandsintown sync |

Per-release: edit form → **Reload tracklist** (force refresh tracks + Odesli).

Cron: `POST /api/releases-track-enrich` daily (requires `CRON_SECRET`).

## Catalogue sync & external IDs

`/admin/releases/sync` — bulk iTunes / Spotify / Discogs import.

Per release: paste platform URLs or raw IDs (Spotify `intl-de/album/…`, Apple Music geo links, etc.) → **Sync** fetches metadata, tracklist, cover, and Odesli links.

## Development

```bash
npm install
cp .env.example .env   # Supabase + R2 keys required for full functionality
npm run dev
npm run migrate        # seed site_config (see scripts/MIGRATION.md)
```

## Agent reference

[AGENTS.md](../AGENTS.md) · [agent/admin.md](./agent/admin.md)