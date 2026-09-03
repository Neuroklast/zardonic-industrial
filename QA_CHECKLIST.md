# QA Checklist â€” Zardonic Industrial

Manual smoke checks for agents and humans after public / admin changes.  
Update this file when user-visible flows change (`docs/agent/workflow.md`).

---

## Public homepage

- [ ] Hero loads; primary CTAs visible and tappable (min 44px)
- [ ] Hero wordmark boot (~1s scan + mini bar under logo) plays when hero is on-screen; not a full-page loader
- [ ] Boot HUD text is plain **LOADING** / Loadingâ€¦ / Ready â€” no fake terminal or cosplay status lines
- [ ] Boot load bar does **not** shift the logo upward (HUD absolute under logo)
- [ ] Hero width sliders (desktop + mobile, 15â€“100%): desktop-tuned size does not shrink mobile; phone logo near full content width when mobile ~90%; aspect ratio kept; centered; no height cap
- [ ] Nav logo full size; every section has a desktop **icon** (BIO not missing)
- [ ] Desktop: hover/focus icon â†’ glitch to short label; mobile: icon + text
- [ ] Hover labels are short (Bio / Releases / â€¦), not full section titles
- [ ] Smooth scroll to sections works (Lenis); mobile hamburger works
- [ ] Releases: open detail â†’ **CyberpunkOverlay** chrome (corners, label, close)
- [ ] Events/gigs: same overlay system as releases
- [ ] Gallery: open image â†’ **same** overlay shell as releases (not a bare lightbox)
- [ ] Gallery: page does not scroll away under the modal; Escape closes
- [ ] Media: homepage teaser + `/media` browse; image cards open overlay preview + download; audio has inline player (no autoplay); PDF/ZIP download
- [ ] Media logos/photos are original colours (no partner white-silhouette pipeline)
- [ ] Events: only past gigs â†’ homepage shows â€œNo upcoming events.â€ (not the past list); `/gigs` still has Past filter
- [ ] Credits / endorsements / partners: logos white-on-dark, **no solid white rectangles** (incl. white-on-black uploads like SEGA)
- [ ] Partner SVGs (HOFA, Baby Audio, SUPERHOT, â€¦) look sharp at desktop size â€” not a 150px-wide smear
- [ ] Console: no CORS on `*.r2.dev` partner logos; **no** `wsrv.nl/?url=https://pub-*.r2.dev`; SVGs and rasters load via `/api/partner-logo`
- [ ] Hard refresh with a stored non-English locale (`zd-locale`): no React #418 hydration text error; chrome stays English for a beat then switches
- [ ] Native (white-fill off) PNG/WebP/SVG logos actually appear (not empty cells); broken files show the partner name
- [ ] Language switch DE/JA/RU: section titles stay readable (no mixed smeared sans-serif, no overflow); CJK titles are not force-latinized
- [ ] Multi-colour transparent logos (e.g. AEW white + gold A/W + gray): with **White logo fill** on, **all** ink is solid white â€” only transparency stays transparent (no gold leftover, no missing white text)
- [ ] Partner logos: hover shows RGB chromatic fringe whether **White logo fill** is on or off (pre-whitened PNG with fill unchecked still fringes)
- [ ] Footer: social icons readable size; legal links not micro-type; wrap on narrow screens
- [ ] Cookie banner / preferences still reachable; Reject focuses first action; Escape closes customize
- [ ] Legal Notice + Privacy Policy routes render from Supabase legal config (EN + DE via language switcher)
- [ ] Incomplete legal fields: admin checklist red + public notice; complete: no warning
- [ ] Network: no request to fonts.googleapis.com / fonts.gstatic.com on cold load
- [ ] Analytics Reject â†’ no POST /api/analytics; Accept â†’ events only after consent
- [ ] Background: video ON â†’ no static bg image layer under video; video OFF â†’ image with opacity
- [ ] After an R2 bucket move / Production deploy: Vercel logs show `[r2-reconcile] run for <sha>` then `done`; `/admin/data` preview can confirm. Network has no `wsrv.nl/?url=https://pub-<OLD>.r2.dev`; partner rasters may still use wsrv but the inner host is the current `R2_PUBLIC_HOST`
- [ ] Background video: scroll scrub stays smooth; no matrix/circuit canvas running on top of the video
- [ ] Background: desktop video ON + mobile â€œNo videoâ€ â†’ video on desktop, image fallback on phone
- [ ] Background video and `/admin/media` uploads succeed on a fresh origin; if they fail with `net::ERR_FAILED` / "failed to fetch", confirm the **R2 bucket CORS** row in Admin â†’ API Health is OK (browser presigned PUT needs a bucket CORS rule â€” see `r2-cors.json`)
- [ ] Biography section renders text (or â€œcoming soonâ€); **no** red â€œ[Bio] â€“ Failed to renderâ€ box
- [ ] Language switch (ES/DE/â€¦): section error fallback strings localize if a section ever crashes; Retry remounts

## Public browse

- [ ] `/releases` list + overlay
- [ ] `/gigs` list + overlay
- [ ] Pagination / empty states do not break layout

## Admin (smoke)

- [ ] Login works; protected routes redirect when logged out
- [ ] Site config / sections draft does not break public nav labels
- [ ] Look & Feel split preview: **Desktop / Mobile** toggle; Mobile iframe ~390px; hero mobile width % visible on Mobile
- [ ] Hero editor: Desktop + Mobile width sliders live-update preview before Save
- [ ] Partner edit: logo upload + white-logo toggle
- [ ] Media replace: upload a second image/video â†’ previous R2 object removed (status mentions previous file removed); failed upload must not delete the old file
- [ ] R2 keys are content-addressed: uploading the same file twice lands on the same object key (no orphaned duplicate); replacing with different bytes creates a new key and deletes the old one
- [ ] After an R2 bucket move / Production deploy: `[r2-reconcile] done objects=â€¦ rows=â€¦ urls=â€¦` in Vercel logs; `/admin/data` preview shows corrected URLs; `content_hash` backfilled on media rows. A deliberately-broken old URL is auto-repaired by the `<img onError>` â†’ `/api/media-fix` path (the image swaps to the corrected URL)
- [ ] Legal admin saves and public pages reflect changes after revalidate
- [ ] Data export JSON includes news posts, manually edited releases (tracks/copy), and site_config keys; import restores them without wiping extra rows
- [ ] Advances: â€œPurge all releasesâ€ / â€œPurge all + re-syncâ€ confirm dialog warns that **manually edited** releases are deleted too; after re-sync the releases list matches the Spotify catalogue (no leftover manual rows)
- [ ] Factory reset: button disabled until backup checkbox ticked + phrase typed; wrong phrase is rejected server-side (nothing deleted); correct phrase + cleanup restores default site config; R2 media left intact unless the â€œdelete mediaâ€ box is checked

## After deploy

- [ ] Production deployment SHA matches expected merge commit
- [ ] Hard refresh (Ctrl+Shift+R) on a cold tab
- [ ] Re-check the exact bugs the user reported (not only â€œpage loadsâ€)

---

## Regression notes (hot)

| Bug | Expected after fix |
|-----|--------------------|
| `â€¦ography` / BIO under logo | Flex logo + compact nav labels |
| Gallery â€œdifferentâ€ modal | `type: 'gallery'` â†’ `CyberpunkOverlay` |
| Media image preview | `type: 'media'` â†’ `CyberpunkOverlay` + `MediaOverlayContent` |
| White PNG box (e.g. QUESTEC) | Canvas silhouette; no CSS invert on plates |
| React #418 text + R2 SVG CORS | Locale after mount; `/api/partner-logo` for R2 SVGs |
| PWM / white wordmark missing | White-on-transparent logos stay visible (not stripped as a plate) |
| Tiny footer | Icons â‰¥28px; legal â‰¥ text-sm |

| Discography missing covers | Releases imported from Spotify/Discogs and the async import path now store cover art on R2; coverless releases show a fallback. Running any catalogue import auto-backfills coverless releases (iTunes then Spotify then Discogs). |
| Sync job shows duplicate-key errors | Re-running an iTunes/Spotify/Discogs import shows no duplicate key value violates unique constraint floods; existing ids are resolved as backfill/update. |
| Sync job double-runs / progress sticky | The job lock is 15 min stale and atomic, so a long/running job is not superseded mid-tick. |
| Duplicate form field id warning | Admin forms (e.g. GigEditDialog) no longer emit "Duplicate form field id in the same form" in the browser Issues panel. |
| PostgREST egress spike (bot crawls) | Public pages are CDN-cached (`Cache-Control: s-maxage` on ISR routes): two consecutive loads in 60s produce **no** Supabase queries on the second. Request with `User-Agent: GPTBot` (or `Bytespider`) → HTTP 403, no function start, no DB hit. `/admin` shows the legacy `supabase.co` URL badge when rows still reference Supabase Storage; media rows with legacy `file_url` show no download link until migrated to R2. |

