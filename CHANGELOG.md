# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Fixed
- **Admin auth unified on Supabase**: protected admin routes now enforce the Supabase session server-side in `app/admin/(protected)/layout.tsx`, legacy `/api/auth` and `/api/session` endpoints now return 404 stubs, and admin server actions return clear auth/configuration errors instead of bubbling generic Server Action failures.
- **Appearance favicon management**: `AppearanceEditor` now includes favicon uploads (`.ico`, `.png`, `.svg`) backed by the existing R2 upload flow, and `app/layout.tsx` now reads `site_config.appearance.faviconUrl` into App Router metadata so the configured icon is emitted site-wide.

### Fixed
- **Admin middleware not running**: `proxy.ts` was never executed by Next.js because the file was not named `middleware.ts`. Created `middleware.ts` in the project root with the correct `export async function middleware(...)` default name and added `/admin/logout` to the pass-through list. `proxy.ts` is now a stub with an explanatory comment.

### Added
- **Gallery inline image management**: `GallerySection` now accepts `onUpdateGallery` prop; in editMode it shows an upload button (Vercel Blob via `useImageUpload`) and a URL-paste field to add images, plus per-image delete and reorder (up/down) controls overlaid on hover.
- **Gallery style overrides now respected**: `GallerySection` reads `adminSettings.sections.styleOverrides.gallery.{columns, aspectRatio, gap, maxVisible, lightbox}` — previously these were registered in `sections-registry.ts` but ignored. Grid columns (2/3/4), aspect ratio (square/16:9/auto), gap, max-visible cap with "Show All" button, and lightbox toggle are all live.
- **ShellSection member overlay**: Clicking the featured-member photo card in `ShellSection` now opens the full `CyberpunkOverlay` (type `member`) with the shell member's data. A "View Profile" hover hint is shown; the card is keyboard-accessible (Enter/Space).
- **Gallery glitch transition**: Opening the gallery now fires `useOverlayTransition()` (the same CRT-glitch flash used before releases/gigs overlays) for visual consistency.
- **`handleUpdateGallery` in AppShell**: `AppShell` wires `onUpdateGallery` to `GallerySection` in editMode, persisting changes back to `siteData.gallery` via `handleUpdateSiteData`.

### Fixed
- **`/admin/logout` 405 Method Not Allowed**: Next.js App Router RSC prefetch sends GET requests (with `?_rsc=…` query param) when the router navigates client-side. The logout route only had a `POST` handler, causing repeated 405 errors in the console. Added a shared `handleLogout` helper and exported both `GET` and `POST` handlers from `app/admin/logout/route.ts`.
- **CSP `connect-src` blocks R2 CloudFlare uploads**: Image/video uploads via pre-signed PUT URLs to `*.r2.cloudflarestorage.com` and `*.r2.dev` were blocked by the Content Security Policy. Added both wildcards to the `connect-src` directive in `next.config.mjs`.

### Added
- **Background video brightness control**: Admins can now independently adjust the brightness of the background video (0–200 %) via a new slider in the Background tab. Added `backgroundVideoBrightness` to `AnimationSettings`, a `brightness` prop to `VideoBackground` (applies CSS `filter: brightness()`), wired it through `BackgroundStack`, and added the slider in `BackgroundTab`.

### Fixed
- **CSP `connect-src` blocks Supabase**: Added `https://*.supabase.co` and `wss://*.supabase.co` to `connect-src` in `vercel.json` so Supabase auth, database, and Realtime connections are no longer blocked by the browser. Tightened `next.config.mjs` `connect-src` from `'self' https: wss:` to the same explicit allowlist for consistency. Updated `security-hardening.test.ts` allowlist and wildcard checks to include the new Supabase entries.
- **`vercel.json` CSP blocks Next.js hydration**: Added `'unsafe-inline'` to `script-src` in the Content-Security-Policy header so Next.js inline scripts can execute and the page hydrates correctly.
- **`vercel.json` `/admin` rewrite blocks admin panel**: Removed the `{ "source": "/admin/:p*", "destination": "/api/denied?_src=/admin/:p*" }` rewrite that was redirecting all admin traffic to `/api/denied`. The admin panel is protected by `middleware.ts` and does not need this rewrite.

### Added
- **`scripts/migrate-site-data.ts`** — TypeScript migration script that inserts all Zardonic band data (bio, gigs, releases, social links, partners, site_config) into Supabase using the service role key to bypass RLS. Run with `npm run migrate`.
- **`scripts/MIGRATION.md`** — Documentation for running the migration script, including setup requirements and table overview.
- **`tsconfig.scripts.json`** — Separate TypeScript configuration for scripts using `module: commonjs` / `moduleResolution: node`, compatible with `ts-node`.
- **`migrate` npm script** — Added `"migrate": "npx ts-node --project tsconfig.scripts.json scripts/migrate-site-data.ts"` to `package.json`.
- **`ts-node` and `dotenv` dev dependencies** — Required to run the migration script directly with `npm run migrate`.

### Fixed
- **CSP / public homepage regressions** — aligned `vercel.json` CSP with Next.js hydration by allowing `'unsafe-inline'` in `script-src`, added `api/package.json` with `"type": "module"` so Vercel treats compiled `/api` functions as ESM, switched the App Router public background video to scroll-driven scrubbing instead of looping autoplay, kept the public bio/credits/gallery/music/releases/gigs sections visible with empty-state placeholders when Supabase returns no rows, and renamed `middleware.ts` to `proxy.ts` to remove the Next.js 16 build deprecation warning.
- **Visual design regression after Next.js migration** — restored the exact pre-migration look of the public site:
  - **HeroSection** now displays the Zardonic logo image with chromatic aberration glitch effects (`hero-logo-glitch`, `cyber2077-scan-build`) and framer-motion fade/slide animations instead of plain text.
  - **SiteNav** now shows the Zardonic logo image with `logo-glitch` and `hover-chromatic-image` effects instead of a plain text link.
  - **SiteBackground** now renders the circuit board animated background (`CircuitBackground`) as a parallax overlay on top of the static background image, matching the default `circuit` animation type from the old app.
- **Black screen on initial load**: `app/providers.tsx` now uses synchronous `domAnimation` import instead of lazy-loading via `loadMotionFeatures`, eliminating the race condition where components rendered before motion features were available.
- **Hero content invisible on load**: `HeroSection` `contentLoaded` state now initialises as `true`, removing the `setTimeout` that deferred content visibility and caused a blank hero on slow connections.
- **Missing body text colour**: `styles/base.css` now sets `color: var(--foreground)` on `body`, ensuring text is visible from the first paint even before theme-specific CSS loads.
- **Blank public page (CSP errors + LazyMotion conflict)**: All public components (`HeroSection`, `BioSection`, `GigsSection`, `ReleasesSection`, `CreditsSection`, `GallerySection`) now import `m` instead of `motion` from `framer-motion`, matching the `LazyMotion` context in `app/providers.tsx` and preventing components from rendering nothing while features load.
- **CSP inline-script errors**: Added `headers()` configuration to `next.config.mjs` with `'unsafe-inline'` in `script-src` to allow Next.js hydration inline scripts and Framer Motion.
- **BackgroundStack Vite-component crash**: Replaced `React.lazy` / `Suspense` with `next/dynamic` (`ssr: false`) for `MatrixRain` and `CircuitBackground` to prevent crashes from browser-only APIs during Next.js server-side rendering.
- **Public-site typography regression after Next.js migration** — `app/layout.tsx` now loads **Orbitron**, **Share Tech Mono**, and **Space Mono** in one Google Fonts request, restoring heading/body/mono font availability expected by CSS custom-property fallbacks.
- **Theme token import regression** — `app/globals.css` now imports `styles/theme.css` before token/base/effect/component/layout styles, restoring Radix color variables, spacing scale (`--size-*`), radius tokens, and dependent Tailwind utilities.
- **Legacy `@/App` type imports** — replaced all remaining `import type { SiteData } from '@/App'` usages across both `components/` and `src/components/` trees with `@/lib/app-types`, resolving Next.js/Vercel TypeScript module-resolution failures.

### Added
- **`app/_components/public/CircuitBackground.tsx`** — port of `src/components/CircuitBackground.tsx` adapted for Next.js App Router (client component, uses `m` from framer-motion within the existing `LazyMotion` context; three parallax depth layers with DOM-injected data-pulse animations).
- **`app/_components/public/BackgroundStack.tsx`** — restored layered public background rendering with lazy-loaded Matrix Rain / Circuit backgrounds, optional video, and token-based stacking.
- **`app/_components/public/GlobalEffects.tsx`** — restored CRT overlay, vignette, scanline background, and full-page noise for the public homepage.
- **`app/_components/public/GallerySection.tsx`** — restored a motion-driven public gallery grid for Supabase gallery entries on the Next.js homepage.
- **`lib/storage/r2-multipart.ts`** — low-level S3 multipart upload functions (`createMultipartUpload`, `signMultipartPart`, `completeMultipartUpload`, `abortMultipartUpload`) for large file uploads via Cloudflare R2.
- **`app/admin/_actions/auth.ts`** — `requireAdmin()` server-side helper that verifies Supabase session and admin role; to be called at the top of every sensitive server action.
- **`app/admin/_actions/r2Multipart.ts`** — server actions wrapping multipart R2 upload functions with `requireAdmin()` protection (`createMultipartUploadAction`, `signMultipartPartAction`, `completeMultipartUploadAction`, `abortMultipartUploadAction`).
- **`hooks/useR2MultipartUpload.ts`** — client-side React hook for multipart uploads of large files (e.g. soundpacks), splitting the file into 5 MB parts and assembling them via signed URLs.
- **`hooks/useImageUpload.ts`** — client-side React hook for simple image uploads (JPEG/PNG/WebP/GIF, max 10 MB) using `createSignedUploadUrl`.
- **`toggleReleaseVisibility`** in `app/admin/_actions/releases.ts` — toggle `active` boolean on releases.
- **`toggleGalleryImageVisibility`** in `app/admin/_actions/gallery.ts` — toggle `visible` boolean on gallery images.
- **`toggleGigVisibility`** in `app/admin/_actions/gigs.ts` — toggle `active` boolean on gigs.
- **`togglePartnerVisibility`** in `app/admin/_actions/partners.ts` — toggle `visible` boolean on partners.
- **`toggleSoundpackVisibility`** in `app/admin/_actions/soundpacks.ts` — toggle `active` boolean on soundpacks.
- **`toggleMerchandiseVisibility`** in `app/admin/_actions/merchandise.ts` — toggle `active` boolean on merchandise.
- **`toggleMusicHighlightVisibility`** in `app/admin/_actions/musicHighlights.ts` — toggle `active` boolean on music highlights.
- **`lib/schemas/soundpack.ts`** — Zod schema and `Soundpack` type.
- **`lib/schemas/merchandise.ts`** — Zod schema and `Merchandise` type.
- **`lib/schemas/musicHighlight.ts`** — Zod schema and `MusicHighlight` type.
- **`services/soundpacksService.ts`** — `getAllSoundpacks()` with `isDev`/`hideDemoFallback`/`ServiceResult` pattern.
- **`services/merchandiseService.ts`** — `getAllMerchandise()` with full service pattern.
- **`services/musicHighlightsService.ts`** — `getAllMusicHighlights()` with full service pattern.
- **`lib/mockData.ts`** — added `DEMO_SOUNDPACKS`, `DEMO_MERCHANDISE`, `DEMO_MUSIC_HIGHLIGHTS` demo data exports.
- **`lib/constants.ts`** — `MEDIA_BUCKET`, `ADMIN_COOKIE_NAME`, `NAV_SECTIONS` constants.
- **`supabase/migrations/20260101000000_initial_schema.sql`** — initial schema migration documenting all tables (`releases`, `gigs`, `gallery`, `bio`, `social_links`, `partners`, `soundpacks`, `merchandise`, `music_highlights`, `site_config`).

### Changed
- **Public homepage restoration** (`app/page.tsx`) — replaced the simplified fixed background with `BackgroundStack`, added `GlobalEffects`, fetched `gallery` rows from Supabase, rendered the restored gallery section, and passed hero background data back into the public hero component.
- **`app/_components/public/HeroSection.tsx`** — replaced the stripped-down text/button hero with the original glitch-logo composition, scanline/noise overlays, mount fade-in, and dual CTA buttons.
- **`app/_components/public/BioSection.tsx`** — restored the animated clip-path heading reveal, blinking cursor, masked collapse/expand biography text, and motion-based text entrance.
- **`app/_components/public/ReleasesSection.tsx`** — restored filter buttons, motion heading reveal, cyber-card release grid styling, platform link buttons, and show-all/show-less behaviour.
- **`app/_components/public/GigsSection.tsx`** — restored staggered motion cards, event data labels, cyber-card hover effects, icon metadata rows, and upcoming/past segmentation.
- **`app/_components/public/CreditsSection.tsx`** — restored motion logo grids with `chromatic-hover` treatment for credits and endorsements.
- **Admin dashboard** (`app/admin/(protected)/page.tsx`) — expanded from 3 to 10 sections; shows live row counts for releases, gigs, gallery, soundpacks, merchandise, music highlights, and partners, plus quick links for bio, social, and site-config.
- **Global CSS font override cleanup** — removed the redundant `body { font-family: 'Space Mono', ... }` rule from `app/globals.css` so `styles/base.css` can apply `var(--font-body, 'Share Tech Mono', monospace)` as intended.
- **Tailwind import deduplication** — removed Tailwind core/preflight/theme imports from `styles/theme.css` because `app/globals.css` already imports Tailwind once.
- **Tailwind scan/config alignment** (`tailwind.config.js`) — updated token-reference comments from `src/index.css` to `styles/tokens.css` and expanded `content` globs to include `src/`, `cms/`, and `services/`.
- **Root layout body class** — removed hardcoded `bg-black` in `app/layout.tsx` so background color is controlled by theme tokens (`--background`) instead of a fixed utility override.
- **Video background default mode** (`src/components/BackgroundStack.tsx`) — video mode now defaults to `scroll` (undefined → scroll-driven). Only an explicit `backgroundVideoMode: 'loop'` setting uses looping autoplay.
- **Admin video UI** (`src/components/admin/BackgroundTab.tsx`) — removed URL text-input fields for desktop and mobile video; replaced with upload-only buttons. Videos are stored in the R2 bucket via signed upload URL. Uploaded filename is shown as read-only confirmation. Playback mode selector now lists "Scroll" first as the default option.
- **Background type label** (`src/components/admin/BackgroundTab.tsx`) — selector entry renamed from "Video Loop" to "Video Scroll" to reflect the new scroll-first default.

### Added
- **`supabase/schema.sql`** — single consolidated SQL script replacing the two migration files (`001_initial_schema.sql`, `002_extend_schema.sql`). Includes `itunes_id text unique` column on `releases` for deduplication.
- **AdminNav rewrite** (`app/admin/_components/AdminNav.tsx`) — Phosphor icons, active-state highlighting via `usePathname()`, desktop sidebar + mobile slide-in drawer with backdrop. Fully mobile-compatible.
- **iTunes sync** (`app/admin/_actions/itunesSync.ts`, `app/admin/(protected)/releases/sync/page.tsx`) — server action fetches iTunes Search API, downloads artwork to Cloudflare R2, upserts releases to Supabase with deduplication by `itunes_id`.
- **Video background support** (`app/_components/public/SiteBackground.tsx`) — added `videoUrl` prop; renders looping muted `<video>` element with static image as poster/fallback when `videoUrl` is set. Fixed-position keeps background behind scrolling content.
- **StreamingLinksEditor** (`app/admin/_components/StreamingLinksEditor.tsx`) — client component for editing platform/URL pairs with datalist suggestions; serialises to hidden input for form submission.
- **BackgroundConfigEditor** (`app/admin/(protected)/site-config/BackgroundConfigEditor.tsx`) — dedicated admin UI for background image (R2 upload + URL input) and video URL.
- **Gallery image thumbnails** (`app/admin/(protected)/gallery/page.tsx`) — gallery admin now renders actual Next.js Image previews via `resolveImageUrl`.
- **`uploadBufferToR2()`** (`app/admin/_actions/r2Upload.ts`) — new server-side binary upload helper for Node.js Buffers (used for iTunes artwork download).
- **Unit tests** — `src/test/site-background.test.tsx` (8 tests), `src/test/itunes-sync.test.ts` (5 tests), `src/test/streaming-links-editor.test.tsx` (7 tests).

### Changed
- **`app/page.tsx`** — reads `bgConfig.video_url` / `bgConfig.video_storage_path` and passes `backgroundVideoUrl` to `SiteBackground`.
- **Release new/edit forms** — integrated StreamingLinksEditor and Image cover preview.
- **`app/admin/(protected)/site-config/page.tsx`** — uses BackgroundConfigEditor for background key instead of raw JSON editor.
- **`app/admin/(protected)/layout.tsx`** — simplified; removed AdminHeader dependency; mobile content padding adjusted for sticky nav bar.

### Removed
- **`supabase/migrations/001_initial_schema.sql`** and **`002_extend_schema.sql`** — replaced by single `supabase/schema.sql`.

---

### Added (prev)
- **DB migration `002_extend_schema.sql`** — adds `music_highlights`, `merchandise`, `soundpacks`, and `newsletter_subscribers` tables with RLS policies; seeds default `site_config` rows for hero, newsletter, merchandise, footer, and background.
- **`lib/r2.ts`** — `r2Url()` and `resolveImageUrl()` helpers that build public Cloudflare R2 URLs from object paths, with fallback to legacy `image_url` columns.
- **Admin: Music Highlights** (`/admin/music-highlights`) — full CRUD for YouTube video/playlist highlights (title, URL, description, display order).
- **Admin: Merchandise** (`/admin/merchandise`) — full CRUD with R2 image uploader and external link.
- **Admin: Soundpacks** (`/admin/soundpacks`) — full CRUD with R2 image uploader and external link.
- **Admin: Site Config** (`/admin/site-config`) — JSON editor for hero, newsletter, merchandise footer text, background image, and footer links; uses `updateSiteConfig` server action with `upsert`.
- **Server actions** — `app/admin/_actions/musicHighlights.ts`, `merchandise.ts`, `soundpacks.ts`, `siteConfig.ts`; `app/_actions/newsletter.ts` (subscribe with GDPR consent gate), `app/_actions/contact.ts` (Resend email, HTML-escaped, server-only).
- **New public homepage** (`app/page.tsx`) — replaced legacy `AppShell`/`useAppState`/KV system with a Next.js server component that fetches all data from Supabase; `revalidate = 60` for ISR.
- **Public section components** under `app/_components/public/`: `SiteBackground`, `SiteNav`, `HeroSection`, `BioSection`, `CreditsSection`, `MusicHighlightsSection` (two-click YouTube consent per GDPR), `ReleasesSection`, `MerchandiseSection`, `SoundpacksSection`, `GigsSection` (upcoming + collapsible past), `NewsletterSection`, `ContactSection`, `SiteFooter` (social icons + legal links), `SectionWrapper`/`SectionDivider`.
- **`app/layout.tsx`** — Space Mono font loaded via `<link>` at runtime (avoids build-time Google Fonts network requirement); OpenGraph metadata.
- **`app/globals.css`** — Space Mono font stack, `.scanline-layer` CSS-only CRT scanline overlay, `.chromatic-hover` filter effect for logo grids.
- **Admin nav** updated with all new sections: Site Config, Biography, Discography, Music Highlights, Merchandise, Soundpacks, Events, Gallery, Credits & Partners, Social Links.
- **`.env.example`** — added `CONTACT_EMAIL` variable.
- **`public/assets/bg-placeholder.jpg`** — minimal placeholder until real album cover is uploaded via Site Config.

### Changed
- **`app/page.tsx`** — migrated from legacy `'use client'` AppShell (KV/Redis) to a server-rendered page backed entirely by Supabase + R2.

 — re-added `@upstash/redis`, `@upstash/ratelimit`, `@vercel/blob`, and `otpauth` as `devDependencies` so Vitest can resolve legacy `api/` imports during the migration phase without reinstating them as production runtime dependencies.

### Fixed
- **`components/ui/chart.tsx` type errors** — narrowed `ChartPayloadItem.value` from `unknown` to `number | string` and added optional chain on `item.payload?.fill` to resolve two TypeScript build errors that blocked `npm run build`.
- **`src/test/security-hardening.test.ts`** — updated `vite.config.ts` reference to `next.config.mjs` following the Vite → Next.js migration.
- **Flaky test timeout** — increased timeout for `six-ui-fixes.test.tsx > renders artist input for new track` from 5 s to 15 s to prevent spurious failures under full-suite load.

### Changed
- **`.gitignore`** — added `.next/` so the Next.js build cache is no longer tracked in git.
- **`tsconfig.json`** — excluded `src/**`, `api/**`, and test files from the Next.js type-check pass (legacy code is validated separately via Vitest).



### Changed
- **Build system migration bootstrap** — replaced Vite scripts/config with Next.js equivalents, created `next.config.mjs` + `postcss.config.cjs`, moved CSS/assets into root `styles/` and `public/assets/`, copied `components/`, `hooks/`, `contexts/`, `layouts/`, `lib/`, and `cms/` to the repository root, and rewired `import.meta.env` usage to `process.env` for the migrated files.

### Changed
- **Tailwind semantic utilities sweep (section headings)** — replaced raw `text-4xl md:text-6xl` with the semantic `text-heading` token on all six section `<h2>` elements (`AppGigsSection`, `AppMusicSection`, `AppReleasesSection`, `AppSocialSection`, `AppMediaSection`, `ContactSection`). Section headings now use the fluid `clamp()`-based `--font-size-heading` variable defined in the design system instead of discrete breakpoint classes.
- **Semantic spacing for ContactSection and AppFooter** — replaced `py-24 px-4` / `py-12 px-4` hard-coded spacing with `py-section px-card` tokens, making these elements consistent with the rest of the layout system.

### Fixed
- **Raw z-index in `HUDReticle`** — replaced magic `zIndex: 9999` with `'var(--z-transition-fx)'` (70); the cursor reticle is `pointer-events: none` and must sit above every layer including modals and system UI, matching the `--z-transition-fx` contract (`src/components/HUDReticle.tsx`).
- **Raw z-index in `CyberCloseButton`** — removed `z-[60]` Tailwind class from className and replaced with `style={{ zIndex: 'var(--z-local-top)' }}`, which correctly expresses "topmost within the enclosing isolated stacking context" (`src/components/CyberCloseButton.tsx`).
- **Raw z-index in `ProfileOverlay` and `ProgressiveImage`** — replaced `z-[1]` Tailwind class (local loading overlay inside an image container) with `style={{ zIndex: 'var(--z-local-above-1)' }}` on both components, using the dedicated local-stacking token.

### Changed
- **Component decomposition refactor** — extracted SecretTerminal logic into `src/components/terminal/useTerminalLogic.ts`, split `ReleaseEditDialog` sections into dedicated release components, moved `MediaBrowser` helpers/overlays into `src/components/media/`, and extracted `AttackerProfileDialog` panels plus shared attacker types into `src/components/security/` without changing runtime behavior.

### Changed
- **App composition refactor** — extracted `src/components/AppShell.tsx` from `App.tsx`, moved loader switching into `src/components/ActiveLoader.tsx`, and split `ThemeCustomizerDialog` into lazy-loaded tab modules under `src/components/theme-customizer/` to reduce top-level component size and defer heavy dialog content.

### Removed
- **DEP0169 warning suppression from npm scripts** — removed `NODE_OPTIONS='--disable-warning=DEP0169'` and the related `cross-env` wrapper from `dev`, `build`, `test`, `test:watch`, `optimize`, and `preview` scripts in `package.json`.

### Security
- **Hardcoded SALT fallback removed from `_ratelimit.ts`** — the public string `'nk-default-rate-limit-salt-change-me'` was replaced with a per-process `randomBytes(32).toString('hex')` dev fallback; production still throws if `RATE_LIMIT_SALT` is unset (`api/_ratelimit.ts`)

### Fixed
- **`@ts-expect-error` in `releases-enrich-stream.ts`** — replaced with an explicit `as unknown as { flush?: () => void }` type cast for the `res.flush()` SSE flush call (`api/releases-enrich-stream.ts`)
- **`useEffect` + `setState` init pattern in `BlinkingCursor`** — replaced with `useState(() => Boolean(get('CURSOR_BLINK_ENABLED')))` lazy initializer; removes one `eslint-disable react-hooks/set-state-in-effect` suppression (`src/components/BlinkingCursor.tsx`)
- **`useEffect` + `setState` init pattern in `GlitchImage`** — same lazy-initializer fix (`src/components/GlitchImage.tsx`)
- **Redundant initial `setDisplayTitle` in `GlitchDecodeLoader`** — moved to a `useState` lazy initializer and added `titleRef.current = 0` reset so the decode animation always restarts correctly on `targetTitle` changes (`src/components/GlitchDecodeLoader.tsx`)

### Changed
- **Extracted `useLoaderProgress` hook** — identical progress-counter, image-precaching, and completion logic was duplicated byte-for-byte in `GlitchDecodeLoader` and `MinimalBarLoader`; extracted to `src/hooks/use-loader-progress.ts` and both components now use it. `completeDelay` is 800 ms for `GlitchDecodeLoader` and 600 ms for `MinimalBarLoader` (`src/hooks/use-loader-progress.ts`, `src/components/GlitchDecodeLoader.tsx`, `src/components/MinimalBarLoader.tsx`)

### Security
- **XSS in Brevo email path** — `sendEmailViaBrevo` in `api/contact.ts` now applies `esc()` to all user-supplied fields (`name`, `email`, `subject`, `message`) before interpolating them into the `htmlContent` HTML string; previously only the Resend path used escaping (`api/contact.ts`)
- **Raw `error.message` leaked in 500 response** — `api/session.ts` catch block no longer forwards the internal exception message to the client; replaced with a generic `'An unexpected error occurred'` string (`api/session.ts`)

### Fixed
- **Dead `zd-session:` fallback in session GET handler** — the fallback `kv.get('zd-session:${token}')` lookup was unreachable dead code (auth.ts stores sessions under `session:${token}`, never `zd-session:`); removed to eliminate the extra Redis round-trip and misleading comment (`api/session.ts`)
- **`IntersectionObserver` not fully cleaned up in `useAnalytics`** — cleanup called `observer.unobserve(element)` which detaches the element but leaves the observer object alive; replaced with `observer.disconnect()` which fully tears down the observer (`src/hooks/use-analytics.ts`)
- **`setState` after unmount in `useLazyImage`** — the second `useEffect` (image preloader) created a `new Image()` with an `onload` callback that would call `setIsLoaded(true)` even after unmount; added a `mounted` flag and `return () => { mounted = false }` cleanup (`src/hooks/use-lazy-image.ts`)
- **Mailchimp URL built with empty datacenter suffix** — when `MAILCHIMP_API_KEY` has a trailing dash (e.g. `key-`), `split('-').pop()` returns `''` producing an invalid `https://.api.mailchimp.com` URL; added an explicit guard in both subscribe and unsubscribe paths, logging an error and skipping the call when dc is empty (`api/newsletter.ts`)

### Security
- **`PUT /api/session`** now returns HTTP 409 if a password hash already exists in Redis, preventing unauthenticated password resets on configured instances (`api/session.ts`)
- **`/api/validate-key`** now applies `applyRateLimit` before any Redis key lookup, preventing brute-force activation-key enumeration (`api/validate-key.ts`)
- **`validateSession`** short-circuits with `return false` when Redis is not configured, preventing handler crashes (500) on unconfigured deployments (`api/auth.ts`)

### Fixed
- **3D model upload broken** — `api/cms/video-upload-token.ts` now accepts `model/gltf-binary` (`.glb`) and `model/gltf+json` (`.gltf`) in addition to video MIME types; the `BackgroundTab` 3D model uploader now works end-to-end
- **`releases-enrichment-status`** previously always returned `pendingCount: 0` and `pending: []`; it now reads the live `releases-enrich-queue` Redis key and reports actual queue progress (`api/releases-enrichment-status.ts`)
- **WebGL memory leak in `ModelBackground`** — cleanup now traverses the Three.js scene and disposes all `Mesh` geometries, materials, and textures before disposing the renderer, preventing GPU memory accumulation across theme switches (`src/components/ModelBackground.tsx`)
- **Post-unmount `setState` in `useVideoUpload`** — added `isMountedRef` guard so progress and uploading state are only updated while the hook's component is mounted (`src/cms/hooks/useVideoUpload.ts`)
- **Post-unmount `setState` in `useMediaUpload`** — same `isMountedRef` guard applied (`src/cms/hooks/useMediaUpload.ts`)
- **`useAppState` setTimeout leak** — the 100 ms delay before `setContentLoaded(true)` is now tracked via `contentLoadedTimerRef` and cleared in the effect cleanup function, preventing a state update on an unmounted tree (`src/hooks/use-app-state.ts`)

### Added
- **`usePublishedContentFull`** — new hook in `src/hooks/usePublishedContent.ts` that returns `{ data, isLoading, error }` for callers that need to distinguish loading / error states from a real null value. The original `usePublishedContent` is unchanged (backward-compatible).
- **`CHANGELOG.md`** — this file; required by the updated AGENTS.md session-end checklist
- **AGENTS.md Section 14** — mandatory per-session checklist and reference table of known-stable fixes

### Changed
- `AGENTS.md` Section 13 (Agent Workflow Requirements) expanded to explicitly require CHANGELOG, LESSONS_LEARNED, README, and AGENTS.md updates at the end of every session

---

## How to add an entry

1. Add under `[Unreleased]` in the appropriate sub-section: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
2. When a version is released, move the `[Unreleased]` block to a new `## [x.y.z] – YYYY-MM-DD` heading.
3. Every agent session that includes code changes **must** add at least one entry.
