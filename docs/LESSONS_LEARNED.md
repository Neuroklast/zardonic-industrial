# Lessons Learned Log — Zardonic Industrial

> **Last Updated:** 2026-04-01  
> **Agent ID:** copilot/deep-audit-dokumentation  

---

## Overview

This document records lessons learned during development sessions. Every coding agent **must** add an entry at the end of each session. These entries help future agents avoid repeated mistakes and build on institutional knowledge.

---

## Entry Template

```markdown
| YYYY-MM-DD | agent/session-id | Agent Type | Lesson description | Category | Severity |
```

**Categories:**
- `Architecture` — structural or design patterns
- `Security` — vulnerabilities, misconfigurations
- `Testing` — test gaps, flaky tests, missing coverage
- `DevOps` — build, CI/CD, deployment issues
- `UX/a11y` — user experience or accessibility issues
- `Performance` — speed, bundle size, Core Web Vitals
- `Dependencies` — package issues, version conflicts
- `Process` — workflow, planning, communication
- `Debugging` — hard-to-find bugs and how they were found

**Severities:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low / ℹ️ Info

---

## Log Table

| Date | Session ID | Agent | Lesson | Category | Severity |
|------|-----------|-------|--------|----------|----------|
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | `App.tsx` has grown to 3 638 lines and is a God Object. Any future feature addition risks cascading side-effects. New state or UI must **never** be added directly to `App.tsx`. | Architecture | 🔴 Critical |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | `tsc -b --noCheck` in the build script silently ignores all TypeScript errors. This means broken types can reach production without any warning. Always check `package.json` build script when onboarding a new repo. | DevOps | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | The entire `api/` directory is excluded from ESLint (`{ ignores: ['dist', 'node_modules', 'api'] }`). Serverless functions with auth/rate-limit logic receive zero static analysis. This is a blind spot — check `eslint.config.js` first when debugging API behaviour. | Security | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | `next-themes` is a Next.js-specific package. Using it in a Vite/React SPA can cause unexpected behaviour during hydration or theme switching. Always verify that packages are ecosystem-compatible before installing. | Dependencies | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | Three separate icon libraries are in use (`@heroicons/react`, `@phosphor-icons/react`, `lucide-react`). This inflates the bundle unnecessarily. When adding new icons, always check which library is already dominant in the component you are modifying, and do not introduce a fourth. | Performance | 🟡 Medium |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | There is only one root-level `ErrorBoundary` wrapping the entire app. A single thrown error in any section unmounts the entire UI. Future work must add per-section error boundaries around every major section component. | Architecture | 🟡 Medium |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | The `middleware.ts` constructs a new `Redis` client on every request inside the handler, not at module scope. While Upstash is stateless HTTP, this is still wasteful on the Edge. Always initialise singleton clients at module scope. | Architecture | 🟡 Medium |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | Offensive security features (`_zipbomb.ts`, `_sql-backfire.ts`, `_log-poisoning.ts`) require a legal review before any jurisdiction-expanding deployment. These features may expose the operator to liability under EU law (Computer Fraud Directives) and US CFAA. | Security | 🟡 Medium |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | The image proxy (`api/image-proxy.ts`) imports `resolve4`/`resolve6` from `node:dns/promises` but DNS pre-resolution must be verified to occur **before** the HTTP fetch, not just at validation. DNS rebinding attacks can bypass host allowlists if the check and the connection happen at different times. | Security | 🟡 Medium |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | The `RATE_LIMIT_SALT` env var falls back to a published hardcoded default (`'zd-default-rate-limit-salt-change-me'`). If this env var is not set in a production environment, IP hash anonymisation is trivially defeated. Always fail loudly (warn/error) when security-critical env vars are missing. | Security | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | `index.css` is 1 990 lines long — it mixes resets, themes, component styles, and animation keyframes. When adding new styles, resist adding to `index.css`. Instead, plan for a split into `base.css`, `animations.css`, `themes.css`. | Architecture | 🟢 Low |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | JavaScript obfuscation is applied after the production build via `javascript-obfuscator`. This inflates bundle size by 30–80%, eliminates tree-shaking benefits, and does not meaningfully protect source code. Evaluate whether this step is worth the performance cost. | Performance | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | There are no E2E tests. Critical user flows (admin login, contact form, newsletter signup) could regress silently. When adding E2E tests, prioritise these three flows first. | Testing | 🟠 High |
| 2026-04-01 | copilot/deep-audit-dokumentation | GitHub Copilot | `CookieBanner.tsx` and `CookieConsent.tsx` both exist in the components folder and appear to duplicate cookie consent logic. Before modifying either, investigate which one is actually rendered in `App.tsx` and remove or merge the unused one. | Architecture | 🟡 Medium |
| 2026-04-13 | jules | Jules | When optimizing images via `wsrv.nl` proxy, ensure that query parameters (such as `w`, `q`, `output`) are appended defensively, especially if the URL already has parameters (e.g. Google Drive URLs), so as not to break the `?url=` parameter structure. Also apply these defaults strictly inside `toDirectImageUrl`. | Performance | 🟡 Medium |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `PUT /api/session` had no guard against overwriting an existing password hash. The correct pattern for "initial setup" endpoints is to read the current value first and return 409 if it already exists — never blindly overwrite. | Security | 🔴 Critical |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `validateSession` in `api/auth.ts` called `kv.get()` (via Proxy) without first checking `isRedisConfigured()`. When Redis env vars are absent, the Proxy throws synchronously inside the handler, causing an unhandled 500. Always short-circuit to `return false` when the backing store is not configured. | Security | 🟠 High |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `api/validate-key.ts` was a public POST endpoint with open CORS (`*`) and **no rate limiting**. Any unauthenticated caller could enumerate activation keys. Every endpoint that performs a Redis membership check must call `applyRateLimit` first. | Security | 🟠 High |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `api/cms/video-upload-token.ts` only allowed `video/mp4` and `video/webm`, making 3D model uploads (`.glb` / `.gltf`) silently fail at the server. When an upload hook is reused for a new file type, always update the server-side allow-list in the token endpoint to match. | Architecture | 🟠 High |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `api/releases-enrichment-status.ts` hardcoded `pendingCount: 0` and `pending: []` — the response was a static placeholder. The queue state was available in the `releases-enrich-queue` Redis key. Always verify that status endpoints read live state rather than returning stubs. | Debugging | 🟡 Medium |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `ModelBackground.tsx` only called `renderer.dispose()` on cleanup, leaving Three.js `Mesh` geometries, materials, and textures allocated on the GPU. For every `renderer.dispose()` call, always precede it with a `scene.traverse()` that disposes each object's geometry and material (including any texture properties). | Performance | 🟠 High |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | Upload hooks (`useVideoUpload`, `useMediaUpload`) called `setState` after the async upload completed without checking whether the component was still mounted. The fix is a `isMountedRef = useRef(true)` set to `false` in the cleanup of a `useEffect` with empty deps. Guard every post-async `setState` with `if (isMountedRef.current)`. | Architecture | 🟡 Medium |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | `usePublishedContent` returned `T` directly, swallowing fetch errors and making it impossible for callers to show error states. The correct pattern is to offer two export levels: a simple `T`-returning hook (backward-compatible) and a richer `{ data, isLoading, error }` variant via `usePublishedContentFull`. This avoids breaking existing callers while enabling better error handling for new ones. | Architecture | 🟡 Medium |
| 2026-05-26 | copilot/stability-remediation | GitHub Copilot | A `setTimeout` inside a `useEffect` without a returned cleanup is a latent memory/state leak. The pattern `setTimeout(() => setState(x), delay)` inside `useEffect` must always be replaced with `const id = setTimeout(...); return () => clearTimeout(id)`. Use a `useRef` to expose the timer ID if the effect body is conditional. | Architecture | 🟡 Medium |

---

## How to Add a New Entry

1. Add a new row to the table above (append at the bottom of the table)
2. Use today's date in `YYYY-MM-DD` format
3. Use your agent's session ID (e.g., `copilot/my-session-name`)
4. Keep the lesson concise but actionable — future agents should be able to act on it
5. Choose the most relevant category and severity from the lists above

---

## Statistics

| Category | Count |
|----------|-------|
| Architecture | 10 |
| Security | 9 |
| Performance | 4 |
| Dependencies | 1 |
| Testing | 1 |
| DevOps | 1 |
| Debugging | 1 |
| **Total** | **27** |

---

*This log is permanent. Do not delete old entries. Superseded lessons should be marked with a note rather than deleted.*

## Typography Binding and Tailwind Conflict Mitigation
When attempting to dynamically bind CSS custom properties (set via an admin panel) to UI elements styled with Tailwind, hardcoded Tailwind typography classes (like `text-4xl`, `font-bold`) will often take specificity precedence and override the injected variables. However, simply removing these classes blindly removes necessary structural styling when the dynamic settings aren't set. The correct pattern is conditional application:
```tsx
const hasCustomHeadingSize = !!typography?.headingFontSize;
const headingClasses = [
  !hasCustomHeadingSize ? 'text-4xl md:text-6xl' : ''
].filter(Boolean).join(' ');
```
This ensures a robust default display that can still be elegantly replaced by global variable rules when configured.
- Fixed Track Artist Extraction and Deduplication in ReleaseOverlayContent
