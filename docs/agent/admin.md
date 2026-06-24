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

## Legal editor

`/admin/legal` — `LegalConfigEditor.tsx`. Draft preview: `broadcastAdminDraft('legal', ...)`.

Footer URL fields: Site Config → Footer & Legal tab.

## Undo / analytics (legacy)

`AdminPanel.tsx`: undo stack (max 50). Analytics gated by `adminSettings.analytics.*` + cookie consent.