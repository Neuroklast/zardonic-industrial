# Public UI — Chrome, Overlays, Logos

Read this before changing homepage chrome, nav, footer, gallery, releases/events modals, or partner logos.

Stack surface: `app/_components/public/*`, `components/CyberpunkOverlay.tsx`, `components/overlays/*`, `lib/nav-links.ts`, `lib/partner-logo-white.ts`, `styles/effects.css`.

---

## SiteNav

| Do | Don't |
|----|--------|
| Logo in flex row: `shrink-0` sibling of `<nav>` | `position: absolute` logo over the link row |
| **Desktop:** icon per section (`lib/nav-icons.ts`); hover/focus **glitches** icon → compact label | Long text labels always visible (clips BIO / `…ography`) |
| Compact labels from `lib/nav-links.ts` (`Bio`, `Releases`, …) for hover + mobile | Full section titles (`Biography`, `Discography`) in the top nav |
| `aria-label` + `title` on icon links; mobile shows icon + text | Icon-only without accessible name |
| CSS: `.nav-glitch-link` in `styles/effects.css` | Custom one-off hover without reduced-motion path |

Files: `app/_components/public/SiteNav.tsx`, `lib/nav-links.ts`, `lib/nav-icons.ts`, `styles/effects.css`.

Regression guard: `src/test/public-mobile.test.tsx`, `src/test/nav-links.test.ts`, `src/test/nav-icons.test.ts`.

---

## CyberpunkOverlay (single modal system)

**All** of these use `CyberpunkOverlay`:

| Type | Opened from | Content |
|------|-------------|---------|
| `release` | Releases section / browse | `ReleaseOverlayContent` |
| `gig` | Gigs / browse | `GigOverlayContent` |
| `gallery` | Gallery section | `GalleryOverlayContent` |
| `contact` | Contact | `ContactOverlayContent` |
| `member` | Bio / members | `MemberOverlayContent` |

Rules:

1. State type: `CyberpunkOverlayState` in `lib/app-types.ts`.
2. Session key: `lib/overlay-session.ts` (include enough identity to re-animate on reopen).
3. Shell owns: backdrop, corners, scanlines, loading/glitch/reveal phases, close button, glow, **Lenis + body scroll lock**.
4. Content components own **only** inner body (no second fixed fullscreen chrome).
5. Gallery: swipe/dots/arrows in `GalleryOverlayContent` — not a parallel lightbox component for production UI.

**Forbidden:** shipping a one-off `fixed inset-0` lightbox that only “sort of” matches releases/events.

---

## Partner / credit logos

Pipeline for white-mode logos (`logo_white !== false`):

1. `loadLogoImageForCanvas(url)` — fetch via wsrv (`partnerLogoCanvasSrc`) → blob → `Image` (avoids CORS-tainted canvas).
2. `processLogoToWhiteSilhouette` — pure white RGB; strip light plates; keep / recover alpha.
3. Render `data:image/png` with **`filter: none`** (class `partner-logo-white` must not re-apply invert).

| Do | Don't |
|----|--------|
| Canvas process white logos | CSS `mask-image: url(cross-origin)` (CORS → solid white fill) |
| Detect light corner plate → inverse-luminance alpha | `brightness(0) invert(1)` on white-bg PNGs (→ solid white box) |
| Fail open: original image, no invert | Fail closed: white rectangle “placeholder” |

Files: `lib/partner-logo-white.ts`, `app/_components/public/CreditsSection.tsx`, `styles/effects.css`.

Tests: `src/test/partner-logo-white.test.ts` (includes white-plate / QUESTEC-style case).

---

## Footer

| Element | Minimum |
|---------|---------|
| Social SVG / custom logo | `h-7 w-7` (sm: `h-8`) |
| Legal / cookie links | `text-sm` (sm: `text-base`), `min-h-[44px]` |
| Copyright | same type scale as legal |
| Layout | `flex-wrap`, generous gap, `py-10+` |

File: `app/_components/public/SiteFooter.tsx`.

---

## Lenis

- Single provider: `contexts/LenisContext.tsx`.
- Public page scroll is Lenis-owned; nested scrollports need care.
- Any modal/overlay that covers the page must `lenis.stop()` on open and `lenis.start()` on close (implemented in `CyberpunkOverlay`).
- Do not add a second Lenis instance.

## Background layers & overlay glow

| Topic | Rule |
|-------|------|
| Animation styles | `lib/public-background-types.ts` — matrix, circuit, **terminal**, **data-stream**, glitch-grid, stars, minimal |
| Admin | Look & Feel → Background; do not hardcode only matrix/circuit |
| Modal glow | Appearance → **Modal glow** (`theme.modalGlowColor` → CSS `--modal-glow`). Must be in theme parse keys so it persists |
| Scroll video | Use `attachScrollVideoSync` — never set `currentTime` on every React `scrollY` state update |
| Perf | Canvas effects: DPR cap, pause on `visibilitychange`, respect `prefers-reduced-motion`, lower density when image/video present |

---

## Visual verification checklist

After public UI changes:

- [ ] Desktop nav: logo full size; **BIO** (or first item) fully visible
- [ ] Open a release and a gallery image — same overlay chrome
- [ ] Credits/endorsements: no white rectangles; marks readable on dark bg
- [ ] Footer: icons and legal text not “micro” type
- [ ] Production deploy SHA matches merge; hard-refresh tested
