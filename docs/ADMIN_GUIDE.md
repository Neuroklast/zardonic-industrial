# Admin Guide

> **Last updated:** 2026-08-10

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
| Discography | `/admin/releases` | Releases + sync |
| Events | `/admin/gigs` | Gigs + Bandsintown sync |
| Newsletter | `/admin/newsletter` | Subscribers |
| Data | `/admin/data` | Import/export + **data maintenance** |

Full nav is in `app/admin/_config/nav-groups.ts`.

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