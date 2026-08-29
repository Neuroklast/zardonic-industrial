# Development Status

> **Last updated:** 2026-08-10  
> **Phase:** Pre-launch — App Router + Supabase; public UI polish + Look & Feel preview

## Quick status

| Area | Status |
|------|--------|
| Public site (`app/page.tsx`) | Functional — Supabase-driven sections |
| Hero wordmark | Desktop + mobile width %; filmic boot when in view; high-res crop export |
| Legal pages | `/legal-notice`, `/privacy-policy` EN+DE + `/admin/legal` completeness |
| Fonts | Self-hosted `next/font` (no Google CDN runtime) |
| E2E smoke | Playwright `e2e/smoke.spec.ts` |
| Admin (`/admin/*`) | Functional — Supabase Auth; Look & Feel **Desktop/Mobile** live preview |
| Content DB | Supabase (`supabase/schema.sql`) |
| Media | Cloudflare R2 (WebP crop uploads, 4 MB body limit) |
| Legacy `api/` | Slim — image proxies, Odesli/Spotify/iTunes/Bandsintown helpers, rate limiting (needs live Upstash) |
| Public geo | App Router (`app/api/geo`) — no Redis; do not reintroduce `api/geo.ts` |
| OG / sitemap | App Router (`app/api/og`, `app/api/sitemap`) |
| Tests | Vitest — 700+ tests (`npm run test`) |
| Tech debt | [TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md) — 5 post-launch items open |

## Public features

- [x] Hero, bio, releases, gigs, gallery, merch, soundpacks, partners
- [x] Hero wordmark: separate desktop/mobile width, aspect-preserving, boot HUD absolute
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
- [x] Look & Feel split preview with Desktop / Mobile iframe width toggle
- [x] Hero dual width sliders + high-res WebP crop export
- [x] CRUD for releases, gigs, gallery, partners, etc.
- [x] Catalogue sync (iTunes, Spotify, Discogs)
- [x] Data import/export (full editorial JSON backup incl. news + manually edited releases) + **data maintenance** (purge/sync, track enrichment)
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