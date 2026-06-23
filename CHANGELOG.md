# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Fixed
- **Vercel Turbopack build (RSC violations + Server Actions)**: Added missing `'use client'` directives to `contexts/LocaleContext.tsx`, `contexts/LenisContext.tsx`, `lib/consent.ts`, `components/CookieConsent.tsx`, `components/KonamiListener.tsx`, `components/CyberpunkOverlay.tsx` and `components/overlays/PrivacyOverlayContent.tsx`. These modules use React client APIs (`createContext`, `useState`, `useEffect`, etc.) and were being statically imported into Server Components (`app/page.tsx` via `PublicPageClient` + overlays). Removed erroneous top-level `'use server'` directive from `app/admin/(protected)/translations/page.tsx` (page components must not declare this). `app/admin/_actions/*` now consistently export only async functions. Added `.github/workflows/ci.yml` to run `lint` + `typecheck` + `test` + `build` on every PR and push, catching these errors before Vercel.
- **Admin login redirect loop — `@supabase/ssr` 0.12.x `setAll` headers**: `@supabase/ssr` ≥ 0.12 passes a second `headers` argument to the `setAll` cookie callback containing `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0`, and `Pragma: no-cache`. Without forwarding these headers, Vercel Edge and other CDNs can cache the 303 redirect response from the login Route Handler and serve it without `Set-Cookie` headers, so the browser never receives the session cookies and the middleware perpetually sees no session. Both `app/admin/login/submit/route.ts` and `middleware.ts` now accept and apply the `headers` second argument in their `setAll` callbacks. Removed the now-unused `type CookieOptions` import from both files. Updated tests in `admin-login-submit-route.test.ts` and `admin-middleware.test.ts` to pass headers through the mock and assert that the response carries the expected `Cache-Control` / `Expires` / `Pragma` headers.
### Added
- **Mobile-first optimization — `xs: 480px` Tailwind breakpoint**: Added `extend.screens.xs = '480px'` to `tailwind.config.js`, enabling responsive classes like `xs:grid-cols-2` for small phones between 320–480px.
- **AdminNav WCAG 2.1 AA touch targets**: Increased nav link padding from `py-2` to `py-3` (~44px hit area) and the hamburger/close buttons to `inline-flex p-2 min-h-[44px] min-w-[44px]` so all interactive elements meet the 44×44px minimum.
- **Admin dashboard responsive grid**: Changed `grid-cols-2` to `grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` for the count section and `grid-cols-1 xs:grid-cols-2 sm:grid-cols-3` for the link section, preventing overflow on iPhone SE (320px).
- **Admin table horizontal scrolling**: Wrapped `<table>` in `<div className="overflow-x-auto">` in all seven admin list pages (releases, gigs, soundpacks, merchandise, music-highlights, partners, social) so wide tables scroll instead of breaking the layout on mobile.
- **Login inputs iOS zoom prevention**: Changed email and password inputs in `app/admin/login/page.tsx` from `text-sm` to `text-base` (16px), preventing iOS Safari from auto-zooming on focus.
- **Mobile optimization tests**: Added `src/test/admin-mobile.test.tsx` with 11 unit tests covering touch targets, responsive grid classes, table overflow wrappers, login input font sizes, and the xs breakpoint configuration.

### Removed
- **Dead browser-client login path**: Removed the `handleSubmit` / `router.push` / `router.refresh` browser-client sign-in flow from `app/admin/login/page.tsx`; the canonical sign-in is now the server Route Handler at `app/admin/login/submit/route.ts`.
- **Dead server action `app/admin/_actions/login.ts`**: Unused `signIn` server action removed; there is now exactly one login mechanism.
- **Legacy root `cms/` directory**: The root-level `cms/` directory was a byte-for-byte duplicate of `src/cms/` and was never imported by the Next.js `app/` router. Removed to eliminate the DRY violation and the `CmsAuthGuard` / `useCmsAuth` → `/api/auth` → `window.location.hash = ''` redirect path that could bounce users out of the admin panel.
- **Dead `src/cms/CmsApp.tsx` and `src/cms/hooks/useCmsAuth.ts`**: Not imported anywhere; removing them eliminates the last reference to the removed `/api/auth` legacy endpoint and the associated `window.location.hash` redirect.

### Fixed
- **Admin login cookie chunking — oversized cookie silently dropped by browser**: `app/admin/login/submit/route.ts` previously hardcoded `httpOnly: true, secure: true, sameSite: 'lax', path: '/'` before spreading Supabase-provided cookie options in its `setAll` handler. For large auth tokens the browser received a single cookie near or above the ~4 KB limit and silently rejected it (leaving a 34-byte empty stub). The `setAll` handler now passes Supabase-provided `options` through unchanged — matching the pattern in `middleware.ts` — so `@supabase/ssr` can emit chunked `Set-Cookie` headers (`sb-…-auth-token.0`, `.1`, …) each well under the browser limit. Added unit tests asserting that every chunk cookie is written with Supabase's exact options and that the error path still redirects correctly.
- **Admin login redirect loop (primary fix)**: `app/admin/login/page.tsx` now renders a native HTML `<form method="POST" action="/admin/login/submit">` instead of calling the browser Supabase client + `router.push()`. The existing server Route Handler (`app/admin/login/submit/route.ts`) signs in via `createServerClient` and writes auth cookies onto the same 303 redirect response — so the browser has the cookies before it ever requests the protected route, eliminating the cookie-propagation race.
- **Middleware drops refreshed cookies on `forbidden` redirect**: `middleware.ts` now copies all cookies from `response` onto the `forbidden` redirect response (mirrors the existing handling in the auth-failure branch). This prevents token burn when Supabase rotates tokens during `getUser()` and the user is subsequently redirected due to a non-admin role.
- **Submit route error message**: `app/admin/login/submit/route.ts` now encodes the actual Supabase error message as a `?msg=` query parameter on the failure redirect (previously always redirected with the generic `?error=invalid`). `LoginForm` displays the `msg` param as the inline auth error.
- **Schema trigger not idempotent**: `supabase/schema.sql` — `handle_new_user()` trigger now uses `ON CONFLICT (id) DO NOTHING` so re-running the migration or re-inserting an existing auth user never overwrites an admin's role.



### Fixed
- **Vercel API TypeScript 5.9 compatibility**: Replaced generic `kv.get<T>()` / `redis.get<T>()` proxy calls across the serverless API handlers with cast-after-await patterns, added explicit callback parameter types, and fixed the remaining OAuth nullability issues so the API code no longer trips the stricter Vercel build checks.
- **Admin login route conflict**: Moved the login POST route handler from `app/admin/login/route.ts` to `app/admin/login/submit/route.ts` and updated the form action so Next.js no longer fails the build with a conflicting page/route definition at `/admin/login`.

- **Admin login redirect loop after server-side auth redirect**: `app/admin/login/page.tsx` now signs in with the browser Supabase client and navigates with `router.push()`/`router.refresh()` only after the session cookies exist in the browser. The obsolete `/admin/login/action` route handler was removed so middleware reads the fresh session immediately instead of bouncing back to login.
- **Admin session persistence — middleware drops refreshed cookies on redirect**: `middleware.ts` now copies all cookies from the Supabase `response` onto the `NextResponse.redirect` response so that token refreshes performed during `getUser()` are not lost when auth fails and the user is redirected to login.
- **Admin session persistence — `createClient()` silently swallows `setAll` errors in Layouts**: Added `createActionClient()` to `lib/supabaseServer.ts` — identical to `createClient()` but without the `try/catch` around `setAll`, so token refreshes are correctly persisted when called from Layouts and Server Actions. `app/admin/(protected)/layout.tsx` now uses `createActionClient()` instead of `createClient()`.
- **Schema drift — `gallery` column renames**: `title` column renamed to `alt` and `visible` column renamed to `active` in the `gallery` table, aligning migrations with `schema.sql`. App Router queries in `app/page.tsx` and `GallerySection.tsx` updated accordingly.
- **Schema drift — `partners` column rename**: `visible` column renamed to `active` in the `partners` table; `togglePartnerVisibility` server action updated.
- **Schema drift — `site_config` restructure**: Bridging migration (`20260103000000_schema_sync.sql`) converts the `site_config` table from `(id uuid PK, key text, value text)` to `(key text PK, value jsonb)`, matching `schema.sql` and the App Router admin code.
- **Missing tables added to migrations**: `profiles`, `newsletter_subscribers`, RLS policies, `handle_new_user` trigger, and seed data rows for `social`, `sound`, `analytics`, `translations`, and `sections` were absent from migrations — now added idempotently.
- **`social_links` RLS**: Initial migration lacked `active` column; `SELECT` policy `WHERE active = true` would fail at runtime. Column and policy now added by the bridging migration.
- **Public release overlay wiring on Next.js homepage**: Added `app/_components/public/PublicPageClient.tsx` as a client wrapper that owns `CyberpunkOverlayState`, passes `onReleaseClick` into `ReleasesSection`, and opens the existing `CyberpunkOverlay` with `type: 'release'`. `app/page.tsx` now renders this wrapper for the releases section and maps each release into the overlay `Release` contract (`coverUrl → artwork`, `release_date → releaseDate`, `year` derived from date).
- **False-positive admin forbidden redirects after login**: `middleware.ts` no longer blocks authenticated users when the edge `profiles` lookup is transiently null/failing. It now redirects to `?error=forbidden` only when a profile is definitively present and `role !== 'admin'`, preventing auth loops while preserving non-admin blocking.

### Added
- **`SocialSection` public component** (`app/_components/public/SocialSection.tsx`): Renders social links from Supabase with platform icon mapping (Instagram, YouTube, Facebook, Twitter/X, TikTok, Bandcamp, Soundcloud, Spotify).
- **`SpotifySection` public component** (`app/_components/public/SpotifySection.tsx`): GDPR-gated Spotify IFrame embed; the `<iframe>` only loads after explicit user consent click, preventing IP leaks on page load.
- **Social and Spotify sections wired into `app/page.tsx`**: Both sections added to `DEFAULT_SECTIONS`, fetched from Supabase, and rendered via the section switch. Includes a Spotify URI normalizer (converts `https://open.spotify.com/artist/ID` → `spotify:artist:ID`).
- **Admin — Security page** (`app/admin/(protected)/security/page.tsx`): Shows RLS-enabled tables, required env-var checklist, and newsletter subscriber count.
- **Admin — Analytics page** (`app/admin/(protected)/analytics/page.tsx`): Displays content stats (releases, gigs, social links, gallery items) and an analytics-enabled toggle backed by `site_config`.
- **Admin — Data Export page** (`app/admin/(protected)/data/page.tsx`): Exports all Supabase tables as formatted JSON.
- **Admin — Translations page** (`app/admin/(protected)/translations/page.tsx` + `TranslationsEditor.tsx`): Server page + client editor for DE/EN string overrides stored in `site_config.translations`.
- **Admin — Sound page** (`app/admin/(protected)/sound/page.tsx`): Form for sound settings (enable/disable, volume, ambient toggle) writing to `site_config.sound`.
- **Admin navigation updated** (`AdminNav.tsx`): Added links for Security, Analytics, Data Export, Translations, and Sound pages with matching Phosphor icons.
- **Admin redirect loop after token refresh**: `middleware.ts` now follows the Supabase SSR cookie pattern (`let response` with `NextResponse.next({ request: { headers } })` re-creation inside `setAll`), persists refreshed cookies onto redirect responses, and returns `?error=config` when Supabase env vars are missing. `app/admin/(protected)/layout.tsx` now relies on middleware for auth/role gating and only keeps a fallback user redirect.
- **Admin login now sets HttpOnly cookies via Server Action**: replaced the client-side `signInWithPassword` flow (which only stored the session in `localStorage`) with a `'use server'` action in `app/admin/_actions/login.ts` that uses `createServerClient` from `@supabase/ssr`. Supabase now writes the session tokens as HttpOnly cookies, which the middleware can read, so users are no longer redirected back to `/admin/login` after every page visit. The `?redirect=` search-param is forwarded through the form via a hidden `redirectTo` input and respected in the server action.
- **Admin auth unified on Supabase**: protected admin routes now enforce the Supabase session server-side in `app/admin/(protected)/layout.tsx`, legacy `/api/auth` and `/api/session` endpoints now return 404 stubs, and admin server actions return clear auth/configuration errors instead of bubbling generic Server Action failures.
- **Appearance favicon management**: `AppearanceEditor` now includes favicon uploads (`.ico`, `.png`, `.svg`) backed by the existing R2 upload flow, and `app/layout.tsx` now reads `site_config.appearance.faviconUrl` into App Router metadata so the configured icon is emitted site-wide.

### Fixed
- **Next.js 16 middleware/proxy conflict**: consolidated the full admin-auth guard directly in root `middleware.ts` and removed `proxy.ts` entirely, resolving the Next.js 16 build error that occurs when both files exist.
- **Releases admin page crash (Digest 54827066)**: `app/admin/(protected)/releases/page.tsx` is a Server Component but had an `onClick` handler on the delete `<button>`, causing a React runtime error ("Event handlers cannot be passed to Client Component props"). Extracted `DeleteReleaseButton` into a dedicated `'use client'` component with `useTransition` for pending-state feedback.

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
