# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **Remote image import for admin media fields** — added `/api/cms/import-image` plus shared Blob import logic so externally hosted images can be fetched server-side, validated against SSRF/private-network targets, and stored in Vercel Blob before being saved.

### Changed
- **Gallery image metadata** — `SiteData.gallery` now accepts structured image entries with optional `linkUrl` values while remaining backward-compatible with legacy string URLs; linked gallery tiles now open their configured external target instead of the lightbox.
- **Admin image editing UX** — CMS image fields now include a direct upload control and automatically import pasted remote image URLs into Vercel Blob on blur. Credit Highlights and Sponsoring editor rows now do the same for manually entered logo URLs.

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
