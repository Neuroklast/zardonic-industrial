# Development Status

> **Last updated:** 2026-06-24  
> **Phase:** Pre-launch — App Router + Supabase; legacy CMS/KV retired

## Quick status

| Area | Status |
|------|--------|
| Public site (`app/page.tsx`) | Functional — Supabase-driven sections |
| Legal pages | `/legal-notice`, `/privacy-policy` + `/admin/legal` |
| Admin (`/admin/*`) | Functional — Supabase Auth |
| Content DB | Supabase (`supabase/schema.sql`) |
| Media | Cloudflare R2 |
| Legacy `api/` | Slim — image proxies, Odesli/Spotify/iTunes/Bandsintown helpers, rate limiting |
| OG / sitemap | App Router (`app/api/og`, `app/api/sitemap`) |
| Tests | Vitest — 700+ tests (`npm run test`) |
| Tech debt | [TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md) — 5 post-launch items open |

## Public features

- [x] Hero, bio, releases, gigs, gallery, merch, soundpacks, partners
- [x] Music highlights, contact (Resend server action), newsletter (Supabase)
- [x] Cookie consent + privacy policy link
- [x] Legal Notice & Privacy Policy (English, `site_config.legal`)
- [x] Spotify/YouTube two-click embeds
- [x] PageLayout, skip-to-content link
- [x] `prefers-reduced-motion` for all animations (CSS global + Framer Motion in public sections)
- [x] Per-section error boundaries on public site

## Admin features

- [x] Supabase login, role-gated routes
- [x] Site config, sections, appearance, legal editor
- [x] CRUD for releases, gigs, gallery, partners, etc.
- [x] Catalogue sync (iTunes, Spotify, Discogs)
- [x] Data import/export + **data maintenance** (purge/sync, track enrichment)
- [x] Odesli cross-platform links on releases (sync + enrichment + public modal)
- [x] Full retirement of legacy KV `AdminPanel` / CMS shell (`cms/`, `src/cms/`, `components/admin/` removed)

## Open work (post-launch)

See **[TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md)**. Non-blocking:

- Icon library consolidation (TD-020)
- Lazy-load Three.js backgrounds (TD-021)
- Redis client singleton (TD-022)
- `index.css` split (TD-031)
- Upstream moderate CVEs in Next/@vercel/node (TD-007)

## Documentation

Canonical index: [docs/README.md](./README.md). Historical docs: [docs/archive/](./archive/) only.