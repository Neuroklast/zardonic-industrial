# Admin Guide

> **Last updated:** 2026-06-24

The admin panel is at **`/admin`**. Sign in at **`/admin/login`** with a Supabase user that has `profiles.role = 'admin'`.

## Sign-in

Use the email/password form (native POST to the server route). Do not use browser-side Supabase sign-in for admin — it causes cookie race issues. See [agent/security.md](./agent/security.md).

## Navigation

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin` | Overview |
| Site Config | `/admin/site-config` | Hero, background, appearance, footer URLs |
| Legal & Privacy | `/admin/legal` | Operator details, privacy policy override |
| Biography | `/admin/bio` | Bio text |
| Gallery | `/admin/gallery` | Images |
| Discography | `/admin/releases` | Releases + sync |
| Events | `/admin/gigs` | Gigs + Bandsintown sync |
| Newsletter | `/admin/newsletter` | Subscribers |
| Data | `/admin/data` | Import/export + **data maintenance** |

Full nav is in `app/admin/_config/nav-groups.ts`.

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

Images and video upload to **Cloudflare R2** via admin upload actions. URLs are stored as `*_storage_path` columns with optional legacy URL fallbacks.

## Data maintenance (`/admin/data`)

**Data Maintenance** panel (below export/import):

| Action | Effect |
|--------|--------|
| Enrich all tracklists | Fetches missing/stale tracklists (Spotify → Discogs → iTunes) + Odesli platform links for non-manual releases |
| Reset tracklists | Clears `tracks` on auto-synced releases (keeps `manually_edited`) |
| Purge + sync releases | Deletes auto-synced releases, re-imports Spotify catalogue, enriches tracklists |
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