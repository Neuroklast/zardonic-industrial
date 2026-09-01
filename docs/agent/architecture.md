# Architecture & Code Structure

## Stack

Next.js App Router (public + admin), Supabase (`site_config`, content tables, auth), Cloudflare R2, Resend. Legacy root `api/` remains for some proxies (rate-limited via Upstash) — prefer `app/api/**` for new routes.

**Never dual-mount the same path:** root `api/<name>.ts` can shadow `app/api/<name>/route.ts` on Vercel. Public `/api/geo` is App Router only. Partner SVG rewrite is `/api/partner-logo` (R2/Supabase SVGs only + SSRF guard) — public `*.r2.dev` has no CORS.

**Public Supabase reads:** use `createPublicClient()` from `lib/supabaseServer.ts` (cookie-less anon). Do not use `createClient()` (cookie session) for homepage/browse content — admin JWT skew must not blank the public site.

## Import paths

Root-level `components/`, `hooks/`, `contexts/`, `layouts/`, `lib/`, `cms/`, `app/` are canonical `@/*` targets. Mirror `src/` only where migration bridge requires it.

## Background performance budget

Shared helpers in [`lib/canvas-perf.ts`](../../lib/canvas-perf.ts):

| Helper | Role |
|--------|------|
| `getCanvasDpr(perfMode)` | Cap 1.0 (perf) / 1.25 (default) |
| `shouldSkipFrame` / `targetFpsForRuntime` | Idle 24–30 FPS; scrolling 12–15; hidden = 0 |
| `subscribeScrollActivity` | Passive window scroll → isScrolling flag |
| `resolveBackgroundPerfMode` | Mobile / video / image / heavy types → `perfMode` |

Heavy types: matrix, terminal, data-stream, glitch-grid, cloud-chamber, circuit, 3d-model, cyberpunk-hud. Stars/minimal stay full quality on desktop without media. Both BackgroundStacks pass the same policy.

**Image vs video exclusivity (public `BackgroundStack`):** render the static background image only when `resolveActiveBackgroundVideoUrl` returns nothing for the current viewport. Active video must not leave the image layer at opacity underneath. Mobile `mobileVideoMode: 'off'` → image fallback on mobile while desktop video can remain on.

## PageLayout (required)

Every public page uses [`layouts/PageLayout.tsx`](../../layouts/PageLayout.tsx). Slots:

| Slot | Use |
|------|-----|
| `backgroundLayers` | Fixed backgrounds |
| `nav` | `SiteNav` |
| `children` | `<main>` content |
| `footer` | `SiteFooter` |
| `globalEffects` | CRT, noise, vignette |
| `overlays` | Modals (releases, contact) |
| `system` | Cookie consent, loading |

Admin shell (`app/admin`) is exempt — uses `data-admin-ui="true"`.

## Z-index

Use CSS tokens from `src/layers.css` / `src/lib/layer-contract.ts` only — **no raw z-index numbers**.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-content` | 10 | Sections, footer |
| `--z-nav` | 30 | Navigation |
| `--z-overlay` | 50 | Modals |
| `--z-system` | 60 | Cookie banner |

Section-local effects need `isolation: isolate`.

## IoC (leaf components)

UI sections/cards receive data via props — no direct context reads in leaf components. Contracts: `src/lib/component-contracts.ts`.

## Schema-driven admin (legacy panel)

| Registry | File |
|----------|------|
| `FIELD_REGISTRY` | `cms/schemas.ts` |
| `SECTION_REGISTRY` | `lib/sections-registry.ts` |
| `DESIGN_REGISTRY` | `lib/sections-registry.ts` |

New CMS fields → `FIELD_REGISTRY`. New section fields → `SECTION_REGISTRY`. Footer **styling** → `DESIGN_REGISTRY`.

## Supabase site config (canonical for public site)

Key-value rows in `site_config`. Public homepage and legal pages read from here.

| Key | Purpose |
|-----|---------|
| `legal` | Operator identity + privacy override — see [security.md](./security.md) |
| `footer` | `legalNoticeUrl`, `privacyPolicyUrl` |
| `appearance`, `hero`, `sections`, … | Site chrome |
| `catalogue_sync` | Artist IDs for iTunes / Spotify / Discogs bulk import |

Admin edits via `app/admin/_actions/siteConfig.ts` → `update_site_config` action.

## Release enrichment (Supabase)

| Layer | File | Role |
|-------|------|------|
| Tracklists | `lib/release-enrichment.ts` | Spotify → Discogs → iTunes; respects `manually_edited` |
| Streaming links | `lib/release-streaming-enrichment.ts` + `lib/odesli.ts` | Odesli merge into `streaming_links` |
| Cron | `app/api/releases-track-enrich/route.ts` | Daily batch (15 releases/call) |
| Admin | `app/admin/_actions/releaseTrackEnrichment.ts` | Manual + bulk triggers |
| Async jobs | `sync_jobs` table + `app/api/sync-jobs/**` | Chunked Spotify/Discogs import, purge+sync |

Schema: `releases.tracks`, `tracks_source`, `last_enriched_at`, `manually_edited`.

## Legal pages

- `/legal-notice` — templates in `lib/legal-templates.ts`
- `/privacy-policy` — admin override: `site_config.legal.privacyPolicyCustom`
- Editor: `/admin/legal`

Do not reintroduce impressum overlays or `admin:settings.legal` KV paths.

### Release cover priority (2026-09-01)

Cover source priority is **iTunes > Spotify > Discogs** (`coverSourceScore` 100/60/40 in `lib/release-cover-art.ts`). `resolveMergedCoverUpdate` adopts the higher-priority cover and discards the losing R2 object. `shouldImportCoverFromSource` allows all three sources. All covers are cached to R2 via `lib/release-cover-r2.ts` (`cacheReleaseCoverToR2`), which both server actions and the async job runner use. When a release has multiple ids, enrichment tries iTunes first, then Spotify, then Discogs (`resolveBestCoverSource` in `lib/release-cover-r2.ts`, invoked during the `lib/release-enrichment.ts` pass).