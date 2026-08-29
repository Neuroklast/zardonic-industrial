# Admin Patterns

## Two admin layers

| Layer | Storage | UI |
|-------|---------|-----|
| **Next.js admin** (primary) | Supabase tables + `site_config` | `app/admin/**` |
| Legacy AdminPanel / CMS | KV `admin:settings`, `zd-cms:*` | `AdminPanel.tsx`, `cms/AdminShell.tsx` |

New public-facing config → **Supabase `site_config`**, not KV.

## Site config mutations

`updateSiteConfig` in `app/admin/_actions/siteConfig.ts` dispatches `update_site_config` via `lib/admin-action-registry.ts`.

Revalidate paths include `/`, `/legal-notice`, `/privacy-policy` after saves.

## Image uploads (hero / media)

Crop → `encodeCanvasForUpload` (WebP, size-capped) → Server Action `uploadOptimizedImage` → R2.

**Downloadable media** (`/admin/media`) is the exception: `FileSourcePicker` uploads **originals** (JPEG/PNG/WebP/GIF, PDF, ZIP, MP3/WAV) via signed PUT or multipart. Do not run press-kit files through the crop→WebP path.

- Next `experimental.serverActions.bodySizeLimit` = **4mb** (default is **1mb** — full-res PNG crops hit this and show production **React #441** / 413).
- Client guard: `SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES` (~3.5 MB) in `lib/optimize-image-constants.ts`.
- Do **not** export crop as raw full-res PNG for upload.

### Replace → auto-delete previous R2 object

`MediaSourcePicker` / `VideoSourcePicker` call `deletePreviousR2ObjectIfReplaced` **only after** a successful new upload or remote cache. The new path is committed first; delete failures do not roll back the new media (status warns). Manual **Delete upload** still available. **Clear selection** never deletes storage.

## AdminActionRegistry

Mutations register in `lib/admin-action-registry.ts` with Zod schemas + tests in `src/test/admin-action-registry.test.ts`.

### Release & data maintenance actions

| ID | Disclosure | Purpose |
|----|------------|---------|
| `enrich_release_tracks` | basic | Single-release tracklist + Odesli enrichment |
| `enrich_all_release_tracks` | basic | Batch enrichment (limit param) |
| `purge_releases` | expert | Delete `manually_edited = false` releases |
| `purge_gigs` | expert | Delete all gigs |
| `reset_release_tracklists` | expert | Clear tracks on auto-synced releases |
| `purge_and_sync_releases` | expert | Purge + Spotify sync + enrichment |
| `purge_and_sync_gigs` | expert | Purge + Bandsintown sync |
| `spotify_sync` / `discogs_sync` / `itunes_sync` | basic | Catalogue bulk import |
| `release_external_sync` | basic | Per-release ID sync |

Server actions: `app/admin/_actions/releaseTrackEnrichment.ts`, `dataMaintenance.ts`, `releaseExternalSync.ts`.

Authenticated admin dispatches use `dispatchAdminActionAsAdmin()` (`expert` disclosure). Real auth is `requireAdmin()`.

## Data import / export (`/admin/data`)

Full-site JSON backup of **editorial** tables via `lib/site-data-backup.ts`:

- **Included:** `releases` (all rows, including `manually_edited` and inactive), `news_posts`, `gigs`, `gallery`, `media_downloads`, `bio`, `partners`, `social_links`, `music_highlights`, `merchandise`, `soundpacks`, every `site_config` key.
- **Excluded:** `api_secrets`, `profiles`, `analytics_events`, `sync_jobs`, `newsletter_subscribers` (PII). R2 media is referenced by URL, not packed into the JSON.
- **Export:** `GET /admin/data/export` (admin session). Service-role client + paginated `select('*')` so the dump is not capped at 1000 rows and is **not** inlined into the admin HTML (old `data-export-json` embedding truncated large catalogues).
- **Import:** upsert by `id` / `site_config.key`. Accepts v1 aliases (`social`, `config`, `musicHighlights`, lone `bio` object). Empty unique IDs (`itunes_id`, …) are stored as `NULL`. Does **not** delete rows missing from the file.

Do not add a second backup format; extend `SITE_BACKUP_SECTIONS` when a new content table appears.

### Async sync jobs

Long catalogue / maintenance syncs use `sync_jobs` (Supabase) + API workers:

| Route | Purpose |
|-------|---------|
| `POST /api/sync-jobs` | Start job (`discogs_sync`, `spotify_sync`, `purge_and_sync_*`) |
| `GET /api/sync-jobs/[id]` | Poll status |
| `POST /api/sync-jobs/[id]/tick` | Process one chunk (cron self-chain + reap cron) |

UI: `CatalogueSyncClient`, `DataMaintenanceClient` + `hooks/useSyncJobPoll.ts`.

## Data maintenance UI

`/admin/data` → `DataMaintenanceClient.tsx` — AlertDialog confirmations, progress for batch enrichment.

## Look & Feel live preview

`AdminPreviewPane` (`app/admin/_components/AdminPreviewPane.tsx`) wraps site-config tabs:

| Control | Behaviour |
|---------|-----------|
| Editor only / Split preview | Hide or show the public iframe |
| **Desktop / Mobile** | Constrains iframe width (mobile = 390px) so CSS media queries fire — hero `logoWidthPercentMobile`, mobile nav, etc. |
| Refresh | Reload iframe + draft broadcast |
| New tab | Open `/?adminPreview=1` |

Drafts: `broadcastAdminDraft` → public `AdminDraftListener` in the iframe. Save still required for production.

## Legal editor

`/admin/legal` — `LegalConfigEditor.tsx`. Draft preview: `broadcastAdminDraft('legal', ...)`.

Footer URL fields: Site Config → Footer & Legal tab.

## Undo / analytics (legacy)

`AdminPanel.tsx`: undo stack (max 50). Analytics gated by `adminSettings.analytics.*` + cookie consent.