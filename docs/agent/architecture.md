# Architecture & Code Structure

## Stack

Next.js App Router (public + admin), Supabase (`site_config`, content tables, auth), Cloudflare R2, Resend. Legacy `api/` + KV remain for some endpoints — prefer Supabase for new public features.

## Import paths

Root-level `components/`, `hooks/`, `contexts/`, `layouts/`, `lib/`, `cms/`, `app/` are canonical `@/*` targets. Mirror `src/` only where migration bridge requires it.

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

Schema: `releases.tracks`, `tracks_source`, `last_enriched_at`, `manually_edited`.

## Legal pages

- `/legal-notice` — templates in `lib/legal-templates.ts`
- `/privacy-policy` — admin override: `site_config.legal.privacyPolicyCustom`
- Editor: `/admin/legal`

Do not reintroduce impressum overlays or `admin:settings.legal` KV paths.