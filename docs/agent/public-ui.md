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

## Homepage lists (gigs / cards)

1. Critical list items must not rely solely on Framer `whileInView` with `initial={{ opacity: 0 }}` — Lenis + IntersectionObserver can leave them invisible forever.
2. Prefer `animate={{ opacity: 1 }}` (as on `/gigs` browse) or `useReducedMotion` with `initial={false}`.
3. Match reduced-motion handling used in `ReleasesSection` / `GallerySection`.

Public content SSR: `createPublicClient()` (cookie-less), not session `createClient()`.

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
2. `processLogoToWhiteSilhouette` — pure white RGB; **only transparent stays transparent**; strip opaque light/dark plates when present.
3. Render `data:image/png` via class `partner-logo-white` — rest state `filter: none` in **CSS only**.

Soft-alpha rule (transparent PNG/SVG, e.g. AEW white + gold + gray): every non-transparent pixel → solid white at source alpha. **Never** kill near-white ink on soft-alpha assets (that made white text vanish and multi-colour marks look wrong).

When white fill is **off** (`logo_white === false`): class `partner-logo-native` (original colours). Same chromatic hover as white mode.

| Do | Don't |
|----|--------|
| Canvas process white logos | CSS `mask-image: url(cross-origin)` (CORS → solid white fill) |
| Soft-alpha → keep **all** ink (any colour) as white | Kill near-white pixels on true-alpha logos (→ missing text / holes) |
| Light plate → non-white marks solid white; dark plate → non-black marks solid white | `brightness(0) invert(1)` on white-bg PNGs (→ solid white box) |
| Chromatic hover via CSS (`.partner-logo-white` / `.partner-logo-native` + `.partner-logo-cell:hover`) | Inline `style={{ filter: 'none' }}` — beats `:hover` and kills RGB fringe |
| Fail open: original image, no invert | Fail closed: white rectangle “placeholder” |

**Upload tips (admin):** Prefer **transparent** PNG/SVG (no baked white/black box). Multi-colour marks (gold A/W, gray brackets) become white automatically with fill on. Keep brand colour: uncheck **White logo fill**. Pre-whitened transparent uploads work with fill on (stay white) or off (native + chromatic hover).

Files: `lib/partner-logo-white.ts`, `app/_components/public/CreditsSection.tsx`, `styles/effects.css`.

Tests: `src/test/partner-logo-white.test.ts` (white-plate / QUESTEC, dark-plate / SEGA, multi-colour soft-alpha / AEW-style).

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

## Hero wordmark

| Do | Don't |
|----|--------|
| Size by **width %** of content column — **desktop and mobile separately** (`logoWidthPercent` → `--hero-logo-width`, `logoWidthPercentMobile` → `--hero-logo-width-mobile`) | One shared % for all breakpoints (desktop-tuned values look tiny on phones) |
| Mobile-first CSS: default to mobile var, `md+` switches to desktop var | Inline `style.width` that fights the media query |
| `width: 100%` of that box, `height: auto` — preserve aspect ratio | Stretch / force height boxes / max-height caps |
| Crop/export at **source resolution** (`resolveSourceScale` + `maxOutputDimension`, e.g. 4096) | Export at editor UI viewport (~420px) → pixelated large logos |
| Center in stage (`flex` + margin auto on glitch box) | Absolute logo over the nav |
| Boot HUD **`position: absolute`** under the logo box | In-flow HUD that shifts/pushes the logo when the bar appears |
| Boot sequence: short filmic one-shot (~1.1s) when **stage is in view** | Page-level loader for the wordmark |
| Toggle: Look & Feel → Hero → `bootSequenceEnabled` | RGB ghost layers over the mark |

**Defaults:** desktop ~55%; mobile unset → `max(desktop, 90)` so existing desktop-only saves still nearly fill the phone column. Admin: Look & Feel → Hero has two sliders.

**Preview:** Look & Feel split pane **Desktop / Mobile** (`AdminPreviewPane`) — mobile iframe is 390px so phone media queries apply without resizing the admin window.

Files: `app/_components/public/HeroSection.tsx`, `styles/components.css` (`.hero-logo-stage`, `.hero-logo-glitch`, `.hero-logo-boot*`), admin `HeroConfigEditor.tsx`, `AdminPreviewPane.tsx`.

Regression: `src/test/public-component-restoration.test.tsx` (desktop + mobile CSS vars; pending until in view; skip when disabled).

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
