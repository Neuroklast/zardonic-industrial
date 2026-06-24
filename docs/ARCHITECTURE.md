# Architecture

> **Last updated:** 2026-06-24

Zardonic is an artist website on **Next.js 16 App Router** with **Supabase** for content and configuration, **Cloudflare R2** for media, and **Resend** for contact email. Legacy `api/` serverless handlers (Upstash Redis) remain for security tooling and some sync jobs.

## Public routes

| Route | Implementation |
|-------|----------------|
| `/` | `app/page.tsx` — sections from Supabase + `site_config` |
| `/legal-notice` | `app/legal-notice/page.tsx` — `site_config.legal` + templates |
| `/privacy-policy` | `app/privacy-policy/page.tsx` — same |
| `/admin/login` | Supabase Auth native form POST |
| `/admin/*` | Protected admin shell |

Redirects: `/impressum` → `/legal-notice`, `/privacy` and `/datenschutz` → `/privacy-policy`.

## Layout

Public pages use [`layouts/PageLayout.tsx`](../layouts/PageLayout.tsx): background, nav, main, footer, global effects, system (cookie consent). Z-index via `var(--z-*)` tokens in `src/layers.css`.

## Data stores

### Supabase (primary)

| Area | Tables / keys |
|------|----------------|
| Content | `bio`, `releases`, `gigs`, `gallery`, `partners`, `merchandise`, `soundpacks`, `music_highlights`, `social_links`, `newsletter_subscribers` |
| Configuration | `site_config` (JSON per key: `hero`, `appearance`, `sections`, `legal`, `footer`, …) |
| Auth | `auth.users`, `profiles` (admin role) |

Public pages read via `lib/supabaseServer.ts`. Admin writes via server actions + service role where needed.

### Cloudflare R2

Admin uploads (images, video, favicon). URLs resolved through `lib/r2.ts` (`resolveImageUrl`).

### Browser

- Cookie consent: `localStorage` (`zd-cookie-consent`)
- Functional prefs: locale, theme, sound
- Optional analytics: consent-gated
- IndexedDB image cache (performance)

### Upstash Redis (legacy `api/`)

Rate limiting, security profiles, legacy KV endpoints — not the source of truth for public site content.

## Admin

**Canonical admin:** `app/admin/(protected)/**`

| Area | Path |
|------|------|
| Site design | `/admin/site-config` |
| Legal & privacy | `/admin/legal` |
| Content | `/admin/bio`, `/admin/releases`, `/admin/gigs`, … |
| Data | `/admin/data` (import/export + maintenance: enrich, purge/sync) |

`site_config` updates go through `app/admin/_actions/siteConfig.ts` → `update_site_config` in `lib/admin-action-registry.ts`.

Legacy `AdminPanel.tsx` / `cms/AdminShell.tsx` (KV-based) still exist in the repo but are **not** the public-site data path.

## Legal content

- Storage: `site_config.legal` only
- Templates: `lib/legal-templates.ts`
- Types/helpers: `lib/legal-content.ts`
- No impressum overlays or `admin:settings.legal` KV

## External services

| Service | Use |
|---------|-----|
| Vercel | Hosting, some cron routes |
| Resend | Contact form email |
| wsrv.nl | Image proxy |
| Spotify / YouTube | Two-click embeds only |
| iTunes / Bandsintown / Odesli | Release and gig enrichment |

## App Router API routes

Examples under `app/api/`: `bandsintown`, `gigs-sync`, `releases-track-enrich` (daily cron). Legacy handlers live under root `api/` for Vercel serverless compatibility.

Release enrichment stack: `lib/release-enrichment.ts`, `lib/release-streaming-enrichment.ts`, `lib/odesli.ts` — see [agent/architecture.md](./agent/architecture.md).

## Testing & quality

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

Vitest tests in `src/test/`. Agent rules: [AGENTS.md](../AGENTS.md).

## Related

- [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- [GDPR_COMPLIANCE.md](./GDPR_COMPLIANCE.md)
- [TECH_DEBT_TRACKER.md](./TECH_DEBT_TRACKER.md)
- [archive/](./archive/) — historical Vite/KV docs