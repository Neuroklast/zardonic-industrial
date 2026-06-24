# Development Status

> **Last updated:** 2026-06-24  
> **Phase:** App Router migration — public site on Supabase; legacy `api/` + KV retained for security/sync

## Quick status

| Area | Status |
|------|--------|
| Public site (`app/page.tsx`) | Functional — Supabase-driven sections |
| Legal pages | `/legal-notice`, `/privacy-policy` + `/admin/legal` |
| Admin (`/admin/*`) | Functional — Supabase Auth |
| Content DB | Supabase (`supabase/schema.sql`) |
| Media | Cloudflare R2 |
| Legacy `api/` + Redis | Partial — security, enrichment crons |
| Tests | Vitest suite (`npm run test`) |
| Tech debt | [TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md) |

## Public features

- [x] Hero, bio, releases, gigs, gallery, merch, soundpacks, partners
- [x] Music highlights, contact (Resend), newsletter (Supabase)
- [x] Cookie consent + privacy policy link
- [x] Legal Notice & Privacy Policy (English, `site_config.legal`)
- [x] Spotify/YouTube two-click embeds
- [x] PageLayout, skip-to-content link
- [ ] `prefers-reduced-motion` for all animations
- [ ] Per-section error boundaries on public site

## Admin features

- [x] Supabase login, role-gated routes
- [x] Site config, sections, appearance, legal editor
- [x] CRUD for releases, gigs, gallery, partners, etc.
- [x] Catalogue sync (iTunes, Spotify, Discogs)
- [x] Data import/export
- [ ] Full retirement of legacy KV `AdminPanel` / CMS shell

## Open work

See **[TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md)** for the authoritative debt list. High-level gaps:

- Consolidate or document remaining legacy `api/` vs App Router routes
- Accessibility: reduced-motion, responsive test coverage
- Dependency and CSP hardening (see tech debt)

## Documentation

Canonical index: [docs/README.md](./README.md). Historical docs: [docs/archive/](./archive/) only.