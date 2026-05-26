# Architecture Overview — Zardonic Industrial

> Last updated: 2026-05-26

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Frontend Architecture](#frontend-architecture)
   - [Entry Points](#entry-points)
   - [Routing & Navigation](#routing--navigation)
   - [Section Structure Pattern](#section-structure-pattern)
   - [Smooth Scrolling (Lenis)](#smooth-scrolling-lenis)
   - [Background System](#background-system)
   - [Theme & Styling](#theme--styling)
4. [Admin Systems](#admin-systems)
   - [Legacy AdminPanel (deprecated)](#legacy-adminpanel-deprecated)
   - [CMS AdminShell (active)](#cms-adminshell-active)
   - [Admin Tabs](#admin-tabs)
5. [API Layer (Vercel Serverless)](#api-layer-vercel-serverless)
   - [Authentication & Sessions](#authentication--sessions)
   - [Rate Limiting & Security](#rate-limiting--security)
   - [Key Endpoints](#key-endpoints)
6. [Media Upload System (Vercel Blob)](#media-upload-system-vercel-blob)
   - [Video Upload](#video-upload)
   - [Image Upload](#image-upload)
7. [Data Persistence](#data-persistence)
8. [CMS Schema-Driven System](#cms-schema-driven-system)
9. [Testing](#testing)
10. [Environment Variables](#environment-variables)
11. [Build & Deployment](#build--deployment)
12. [Open Tech Debt](#open-tech-debt)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Framer Motion, Lenis (smooth scroll) |
| UI Components | shadcn/ui (Radix primitives) |
| Icons | Phosphor Icons + Lucide |
| API / Serverless | Vercel Functions (Node.js) |
| File Storage | Vercel Blob |
| KV Storage | Vercel KV (site data + sessions) |
| Email | Resend |
| Auth | Session-based (bcrypt password, KV sessions) |
| Testing | Vitest + React Testing Library |
| Linting | ESLint |
| Type Checking | TypeScript compiler (`tsc -b --noEmit`) |

---

## Repository Structure

```
/
├── api/                    Vercel serverless functions
│   ├── admin/              Admin-specific endpoints
│   ├── cms/                CMS upload token endpoints
│   ├── _*.ts               Internal helpers (prefixed with _)
│   └── *.ts                Public API handlers
│
├── src/
│   ├── App.tsx             Root component — section orchestration
│   ├── main.tsx            React entry point
│   ├── index.css           Global styles, CSS variables, utility classes
│   │
│   ├── assets/             Static assets (images, fonts)
│   ├── cms/                Schema-driven CMS system
│   │   ├── AdminShell.tsx  CMS shell wrapper
│   │   ├── CmsApp.tsx      CMS routing entry
│   │   ├── CmsRouter.tsx   CMS tab routing
│   │   ├── CmsSidebar.tsx  CMS navigation sidebar
│   │   ├── schemas.ts      Section field schemas
│   │   ├── section-schemas/ Per-section schema definitions
│   │   ├── editors/        Field editor components
│   │   ├── hooks/          CMS-specific hooks
│   │   │   ├── useVideoUpload.ts  Vercel Blob video upload
│   │   │   └── useImageUpload.ts  Vercel Blob image upload
│   │   └── components/     CMS UI components (MediaBrowser, etc.)
│   │
│   ├── components/         Site section + shared UI components
│   │   ├── App*.tsx        Section components (AppHeroSection, etc.)
│   │   ├── admin/          Admin panel tab components
│   │   │   ├── BackgroundTab.tsx
│   │   │   ├── AppearanceTab.tsx  (@deprecated)
│   │   │   └── ...
│   │   ├── ui/             shadcn/ui base components
│   │   └── overlays/       Cyberpunk overlay components
│   │
│   ├── contexts/           React contexts
│   │   ├── LenisContext.tsx  Smooth scroll provider
│   │   └── LocaleContext.tsx i18n provider
│   │
│   ├── hooks/              Shared React hooks
│   ├── lib/                Utility functions, types, constants
│   │   ├── types.ts        AdminSettings, SectionLabels, etc.
│   │   ├── app-types.ts    SiteData, HeroLink, etc.
│   │   ├── device-capability.ts  Lite-mode detection
│   │   └── ...
│   │
│   ├── layouts/            Page layout wrappers
│   ├── styles/             Additional CSS modules
│   └── test/               Vitest test files
│
├── docs/                   Project documentation
├── public/                 Static public assets
├── vercel.json             Vercel deployment config
├── vite.config.ts          Vite build config
├── tailwind.config.ts      Tailwind CSS config
└── package.json
```

---

## Frontend Architecture

### Entry Points

- **`src/main.tsx`** — mounts `<App />` into `#root`, wraps with `<LocaleProvider>`, `<LenisProvider>`, and `<Toaster>`.
- **`src/App.tsx`** — the root component. Loads site data from KV (via `/api/kv`), handles admin auth, renders all page sections in a flex-column with CSS `order` for reorderable sections.

### Routing & Navigation

The app is **single-page, hash-based**. There is no client-side router library.

- `#admin` hash triggers the CMS AdminShell overlay.
- `Ctrl+K` opens the command palette / CMS quick-access.
- Section navigation uses Lenis `scrollTo()` rather than `<a href="#section">`.

### Section Structure Pattern

Every page section follows this consistent structure:

```tsx
<div style={{ order: sectionOrder }}>       // flex ordering
  {visible && (
    <>
      <Separator className="bg-border" />   // visual divider
      <section
        id="section-id"
        className="py-24 px-4 scanline-effect"
        data-theme-color="..."              // theme color hints
      >
        <div className="container mx-auto max-w-6xl">
          {/* content */}
        </div>
      </section>
    </>
  )}
</div>
```

**Consistency rules:**
- Padding: always `py-24 px-4`
- Effect class: always `scanline-effect` (not `noise-effect`)
- Always preceded by a `<Separator className="bg-border" />`
- Always has `data-theme-color` attribute
- Always has an `id` for scroll targeting

### Smooth Scrolling (Lenis)

Implemented in **`src/contexts/LenisContext.tsx`**.

- Uses `@studio-freight/lenis` (RAF-based smooth scroll).
- Auto-degrades to native scroll on:
  - `prefers-reduced-motion: reduce`
  - Slow network connections (`navigator.connection.effectiveType === '2g'`)
  - Low-end hardware (`navigator.hardwareConcurrency < 2`)
- Exposed via `useLenis()` hook → `{ lenis, scrollToSection }`.
- `scrollToSection(id)` is called from `App.tsx` and nav items.

### Background System

The background is a **fixed-position layered stack** rendered by `<BackgroundStack>` behind all page content. Section backgrounds are **transparent** — sections never have their own background colors.

**Layer order (bottom to top):**
1. Solid base color (`bg-background`)
2. Background image (optional, `position: fixed`)
3. Background video (optional, `position: fixed`)
4. 3D model / particle canvas (optional)
5. Circuit / noise / scanline overlay effect
6. Page content (transparent sections)

**Effect classes** applied to section elements are CSS post-processing effects (scanlines, noise), **not** background fills.

---

## Admin Systems

### Legacy AdminPanel (deprecated)

**File:** `src/components/AdminPanel.tsx`

- `@deprecated` — kept for backward compatibility.
- Still accessible via `AdminDialogManager` (triggered by certain keyboard shortcuts).
- Uses direct KV writes; does **not** go through CMS schema system.
- `AppearanceTab` inside is also `@deprecated`.
- **Do not add new features here.** All new admin functionality belongs in CMS AdminShell.

### CMS AdminShell (active)

**Entry:** `src/cms/AdminShell.tsx` → `CmsApp.tsx` → `CmsRouter.tsx`

- Triggered by `/#admin` URL hash or `Ctrl+K`.
- Schema-driven: sections and their fields are declared in `src/cms/schemas.ts` and `src/cms/section-schemas/`.
- Tabs are routed via `CmsRouter.tsx`; the sidebar is `CmsSidebar.tsx`.
- Uses React context (`CmsEditContext`) for shared edit state.

### Admin Tabs

| Tab | File | Notes |
|-----|------|-------|
| Background | `src/components/admin/BackgroundTab.tsx` | Video + image + 3D model upload; background type, opacity, etc. |
| Appearance | `src/components/admin/AppearanceTab.tsx` | **@deprecated** |
| Sections | CMS section-schemas | Schema-driven per-section editing |
| Analytics | `src/hooks/use-analytics.ts` | Stats dashboard bridge |
| Newsletter | `api/newsletter.ts` | Resend-backed email list |
| Security | `api/security-settings.ts` | Blocklist, rate limits |

---

## API Layer (Vercel Serverless)

All API handlers live in `api/` and are deployed as Vercel Serverless Functions.

### Authentication & Sessions

- **`api/auth.ts`** — login endpoint; validates password (bcrypt), creates session in KV.
- **`api/session.ts`** — session check / refresh.
- **`api/validate-key.ts`** — API key validation for admin operations.
- Sessions stored in Vercel KV with TTL.
- `validateSession(req)` helper used by all protected endpoints.

### Rate Limiting & Security

- **`api/_ratelimit.ts`** — sliding-window rate limiter backed by Vercel KV.
- **`api/_blocklist.ts`** — IP blocklist; checked before request processing.
- **`api/_threat-score.ts`** — accumulates threat signals per IP.
- **`api/_probe-detection.ts`** — detects scanner/probe patterns.
- Security incidents logged to KV via `api/_security-logger.ts`.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `api/auth.ts` | POST | Admin login |
| `api/session.ts` | GET/POST | Session management |
| `api/kv.ts` | GET/POST | Site data persistence |
| `api/cms/video-upload-token.ts` | POST | Vercel Blob upload token for videos |
| `api/cms/image-upload-token.ts` | POST | Vercel Blob upload token for images |
| `api/newsletter.ts` | POST | Newsletter subscription (Resend) |
| `api/contact.ts` | POST | Contact form submission (Resend) |
| `api/releases-enrich.ts` | POST | iTunes/Discogs release enrichment |
| `api/gigs-sync.ts` | POST | Setlist.fm / Bandsintown gig sync |
| `api/spotify.ts` | GET | Spotify now-playing |
| `api/instagram.ts` | GET | Instagram feed proxy |
| `api/analytics.ts` | GET/POST | Page view analytics |
| `api/og.ts` | GET | Dynamic Open Graph image |
| `api/health.ts` | GET | Health check |

---

## Media Upload System (Vercel Blob)

All media files (videos, images, 3D models) are stored in **Vercel Blob** (`@vercel/blob`). The client uses a two-step client-initiated upload pattern:

1. Client requests an upload token from the API (authenticated).
2. Client uploads directly to Vercel Blob using the token.

This avoids routing large files through the serverless function.

### Video Upload

- **API token endpoint:** `api/cms/video-upload-token.ts`
  - Allowed types: `video/mp4`, `video/webm`, `model/gltf-binary`, `model/gltf+json`
  - Max size: 500 MB
- **Client hook:** `src/cms/hooks/useVideoUpload.ts`
  - Uploads to path: `videos/{timestamp}-{safeName}`
  - Progress tracking via `onUploadProgress`
- **Used in:** `BackgroundTab.tsx` (desktop video, mobile video, 3D model fields)

### Image Upload

- **API token endpoint:** `api/cms/image-upload-token.ts`
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `image/avif`
  - Max size: 20 MB
- **Client hook:** `src/cms/hooks/useImageUpload.ts`
  - Uploads to path: `images/{timestamp}-{safeName}`
  - Progress tracking via `onUploadProgress`
- **Used in:**
  - `BackgroundTab.tsx` — background image field (upload button next to URL input)
  - `AppHeroSection.tsx` — primary hero image and extra slideshow images

> **Note:** Previously `AppHeroSection` used `FileReader.readAsDataURL()` to encode images as base64 strings stored directly in Vercel KV. This was replaced with Vercel Blob uploads to avoid KV size limits (~64 KB per value) and improve performance.

---

## Data Persistence

All site content is stored in **Vercel KV** (Redis-compatible).

| Key pattern | Content |
|-------------|---------|
| `site:data` | Full `SiteData` object (bio, releases, gigs, gallery, social, etc.) |
| `admin:settings` | `AdminSettings` (background, newsletter, sections, theme, etc.) |
| `session:{id}` | Admin session token (with TTL) |
| `analytics:*` | Page view counters |
| `security:*` | Threat scores, blocklist entries, incidents |

**Normalisation:** `src/lib/release-adapters.ts` contains `normalizeStoredRelease()` which guards against old KV data shapes during migration.

---

## CMS Schema-Driven System

The CMS uses a declarative schema system to generate editing UIs without per-field custom components.

**Schema definition:** `src/cms/schemas.ts` + `src/cms/section-schemas/`

```ts
// Example field schema
{ key: 'title', type: 'text', label: 'Section Title', placeholder: 'ARTIST NAME' }
{ key: 'image', type: 'image', label: 'Photo' }  // renders image upload
{ key: 'enabled', type: 'boolean', label: 'Enabled' }
```

Field types: `text`, `textarea`, `boolean`, `number`, `select`, `image`, `video`, `color`, `array`.

**Field editors** are in `src/cms/editors/` — each handles one field type and renders the appropriate input widget.

---

## Testing

- **Framework:** Vitest + React Testing Library + jsdom
- **Run:** `npm run test`
- **Count:** ~1687 tests across 112 test files (as of 2026-05-26)
- **Location:** `src/test/` + `src/lib/__tests__/`
- Test files are named `*.test.ts` or `*.test.tsx`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of admin password |
| `SESSION_SECRET` | ✅ | Secret for session signing |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob access token |
| `KV_REST_API_URL` | ✅ | Vercel KV endpoint |
| `KV_REST_API_TOKEN` | ✅ | Vercel KV auth token |
| `RESEND_API_KEY` | ✅ | Resend email API key |
| `SPOTIFY_CLIENT_ID` | Optional | Spotify now-playing |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify now-playing |
| `SPOTIFY_REFRESH_TOKEN` | Optional | Spotify now-playing |
| `INSTAGRAM_TOKEN` | Optional | Instagram feed |
| `SETLISTFM_API_KEY` | Optional | Setlist.fm gig sync |
| `BANDSINTOWN_APP_ID` | Optional | Bandsintown gig sync |
| `ALERT_EMAIL` | Optional | Security alert recipient |

---

## Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build

# Type checking only
npm run typecheck

# Linting
npm run lint

# Tests
npm run test
```

Deployed on **Vercel**. The `vercel.json` configures:
- Serverless function routing (`api/**` → Node.js runtime)
- Rewrites for SPA fallback
- Headers for security (CSP, HSTS, etc.)

---

## Open Tech Debt

See [`docs/TECH_DEBT_TRACKER.md`](./TECH_DEBT_TRACKER.md) for the full list of open items. Key architectural items:

| Item | Impact | Notes |
|------|--------|-------|
| No client-side router | Medium | Hash-based navigation only; back/forward behaves unexpectedly |
| No global state management | Medium | Prop-drilling from `App.tsx` to sections; complex to maintain |
| Monolithic `App.tsx` (~560 lines) | Medium | All section state, handlers, and render logic in one file |
| Dual admin systems | Low | `AdminPanel.tsx` (deprecated) still active alongside CMS AdminShell |
| `AppearanceTab` deprecated | Low | Legacy appearance editing; superseded by CMS appearance schemas |
| No image optimisation pipeline | Low | Images served as-uploaded from Vercel Blob; no resizing/format conversion |
| Gallery images in KV | Low | Gallery stores image URLs in KV; large galleries may approach size limits |
