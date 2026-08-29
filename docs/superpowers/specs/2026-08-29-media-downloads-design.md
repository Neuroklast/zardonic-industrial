# Media Downloads + Events Empty State

**Date:** 2026-08-29  
**Status:** Approved (implementation in same session)

## Goal

Artist can publish downloadable files (press photos, logos, PDFs/ZIPs, audio) as a homepage section plus a dedicated `/media` browse page. Homepage Events show past gigs only when upcoming gigs exist; otherwise “No upcoming events.”

## Data

Table `media_downloads`:

- `title` (required), `description`
- `category`: `photo` | `logo` | `document` | `audio` | `other` (default `other`)
- `file_storage_path`, `file_url` — original in R2, **not** WebP-recompressed
- `file_mime`, `file_size_bytes`, `original_filename`
- `display_order`, `active`, `created_at`

Click behaviour is derived from MIME (`image` overlay, `audio` inline player, `pdf`/`zip` direct download), not from category. A ZIP of photos can stay `photo`.

RLS: public SELECT `active = true`; admin full. Backup via `SITE_BACKUP_SECTIONS`.

Section id `media` (nav “Media”, Download icon). Existing sites get the section appended via `mergeWithDefaultSections`. Route `/media`. Do not revive Vite `MediaBrowser`.

## Public UI

- Homepage `#media`: up to 8 cards + “View all” → `/media`
- `/media`: search, category filter, pagination 12
- Images: thumbnail + `CyberpunkOverlay` type `media` (preview + download)
- Audio: `<audio>` on the card, no autoplay, `preload="none"`
- PDF/ZIP: `<a download>`
- Logos in this grid are **not** run through the partner white-silhouette pipeline

Events homepage: if `upcoming.length === 0`, hide past list, show `gigs.noEvents`. Keep “View all” → `/gigs` when past events exist. `/gigs` browse unchanged.

## Admin

`/admin/media` CRUD. Direct-to-R2 signed PUT; multipart above ~8 MB.

| Type | MIME | Limit |
|------|------|--------|
| Images | jpeg, png, webp, gif | 25 MB |
| PDF | application/pdf | 25 MB |
| ZIP | application/zip | 100 MB |
| Audio | mp3, wav | 50 MB |

No crop editor. Replace deletes previous R2 object after the new upload succeeds.

## Out of scope

Password gate, zip-all, video, crop, white-logo pipeline, Vite MediaBrowser, Vercel download proxy.
