# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

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
