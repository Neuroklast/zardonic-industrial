# Lessons Learned Log — Zardonic Industrial

> **Last Updated:** 2026-06-06  
> **Agent ID:** copilot/architecture-refactor  

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
| 2026-05-26 | copilot/legacy-cleanup | GitHub Copilot | Use `useState(() => expensiveInit())` lazy initializers instead of `useEffect` + `setState` for one-time config reads. The lazy form avoids an extra render cycle, removes the need for `eslint-disable react-hooks/set-state-in-effect`, and is the canonical React pattern. | Architecture | 🟡 Medium |
| 2026-05-26 | copilot/legacy-cleanup | GitHub Copilot | `vi.mock` factory functions are hoisted to the top of the file before variable declarations. Referencing a `const` inside the factory throws "Cannot access before initialization". Use `vi.hoisted(() => ({ myMock: vi.fn() }))` to define mocks that are safe to reference inside `vi.mock` factories. | Testing | 🟠 High |
| 2026-05-26 | copilot/legacy-cleanup | GitHub Copilot | `vi.advanceTimersByTime` with `async act` can fail to flush cascaded React state updates (effect A sets state → triggers effect B). Use sequential sync `act(() => { vi.advanceTimersByTime(n) })` calls — the pattern that already passes in the test suite — rather than a single `async act` with a large time step. | Testing | 🟡 Medium |
| 2026-05-26 | copilot/legacy-cleanup | GitHub Copilot | Dev-mode security fallbacks must be unpredictable even if public. Replacing a hardcoded string constant with `randomBytes(32).toString('hex')` costs nothing but makes the dev secret ephemeral and unguessable, eliminating SSRF/rate-limit bypass risks during local development. | Security | 🟠 High |
| 2026-05-26 | copilot/legacy-cleanup | GitHub Copilot | When two sibling components contain byte-for-byte identical effect logic, extract it into a shared hook. The configurable parameter (here: `completeDelay`) makes the hook reusable without losing per-component flexibility. | Architecture | 🟡 Medium |
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
| 2026-06-06 | copilot/architecture-refactor | GitHub Copilot | When a dialog owns shared state, undo history, DOM previews, or file inputs, keep that shell in the parent component and lazy-load only the tab panels. This preserves behavior while shrinking the eagerly loaded bundle and keeps each tab focused. | Architecture | 🟡 Medium |
| 2026-06-06 | copilot/architecture-refactor | GitHub Copilot | When splitting oversized UI files, move either stateful logic into a hook or self-contained view blocks into sibling components, but keep the owning dialog/browser shell in place so behavior, focus flow, and prop contracts stay unchanged. | Architecture | 🟡 Medium |
| 2026-06-16 | copilot/next-bootstrap | GitHub Copilot | During a Vite → Next App Router bridge migration, copy every alias-backed top-level folder used by `@/...` imports (including `cms/`, not only `components/`/`hooks/`/`lib/`). Leaving one alias root behind causes immediate module-resolution failures even when the visible page code looks unchanged. | DevOps | 🟠 High |
| 2026-06-18 | copilot/bugfix-ux | GitHub Copilot | Next.js App Router RSC sends GET requests (with `?_rsc=…`) to any route the client-side router navigates to or prefetches. A route that only exports `POST` returns 405 and floods the console. Always export both `GET` and `POST` from action-style routes (like `/admin/logout`) by extracting shared logic into a helper function. | Debugging | 🟠 High |
| 2026-06-18 | copilot/bugfix-ux | GitHub Copilot | Pre-signed PUT URLs to R2 CloudFlare (`*.r2.cloudflarestorage.com`) are blocked by `connect-src` unless the wildcard is explicitly listed. The `images.remotePatterns` in `next.config.mjs` does NOT affect the CSP — `connect-src` and `img-src`/`media-src` are separate directives. Always verify every upload target domain appears in `connect-src`. | Security | 🟠 High |
| 2026-06-18 | copilot/login-fix | GitHub Copilot | `@supabase/ssr` ≥ 0.12 changed `SetAllCookies` to pass a **second `headers` argument** (`Cache-Control: private, no-cache…`, `Expires`, `Pragma`) alongside the cookies. Ignoring this argument means CDNs / Vercel Edge can cache the 303 login redirect and strip the `Set-Cookie` headers before they reach the browser — producing an invisible infinite redirect loop. Both the login Route Handler and middleware must apply these headers to the response via `Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))`. | Dependencies | 🔴 Critical |
| 2026-06-16 | copilot/features-overhaul | GitHub Copilot | `<input list="...">` has an implicit ARIA role of `"combobox"`, not `"textbox"`. `getAllByRole('textbox')` silently returns an empty array. Query these inputs by attribute selector (`querySelectorAll('input[aria-label^="..."]')`) or `getAllByRole('combobox')` instead. | Testing | 🟡 Medium |
| 2026-06-16 | copilot/features-overhaul | GitHub Copilot | jsdom resolves relative URLs into absolute ones for DOM properties (e.g. `video.poster → 'http://localhost:3000/poster.jpg'`). When asserting values set as relative paths, use `getAttribute('poster')` instead of the reflected `.poster` property. | Testing | 🟡 Medium |
| 2026-06-16 | copilot/features-overhaul | GitHub Copilot | Destructuring `const { container } = document` is always `undefined` — `document` has no `container` property. Always destructure `container` from the return value of `render()`. | Testing | 🟢 Low |
| 2026-06-17 | copilot/fix-imports-from-app | GitHub Copilot | In the App Router migration, `@/*` resolves to root-level canonical folders. Any leftover `from '@/App'` type import breaks Next.js type checking because root `App.tsx` is no longer an alias target. Use `@/lib/app-types` for `SiteData` and related app-level types. | DevOps | 🟡 Medium |
| 2026-06-17 | copilot/fix-font-loading-issues | GitHub Copilot | In Next.js App Router migrations, missing one foundational stylesheet import (`styles/theme.css`) can silently break all Tailwind token-backed spacing/colors because `--size-*` and Radix variables disappear. Keep Tailwind imported once in `app/globals.css`, then import token/theme layers in deterministic order. | DevOps | 🔴 Critical |
| 2026-06-18 | copilot/fix-csp-inline-script-errors | GitHub Copilot | Security assertions copied from a static/Vite setup can become wrong after a Next.js App Router migration. Re-verify CSP and HTML-template tests against the real deployment path (`vercel.json` edge headers + no root `index.html`) before treating them as hardening guarantees. | DevOps | 🟠 High |
| 2026-06-18 | copilot/modal-wiring | GitHub Copilot | When a discriminated-union overlay is fully implemented (e.g. `CyberpunkOverlayState.type = 'member'`), always trace every trigger site to verify it is actually called. The `member` overlay existed for months without any `setCyberpunkOverlay({ type: 'member', ... })` call because `ShellSection` lacked the `onMemberClick` prop — the feature was invisible despite being "complete". | Architecture | 🟡 Medium |
| 2026-06-18 | copilot/fix-middleware | GitHub Copilot | Next.js Edge Middleware **must** be in a file named exactly `middleware.ts` (or `middleware.js`) in the project root, and the handler must be exported as `export async function middleware(...)`. A file with any other name (e.g. `proxy.ts`) or a named export (`export async function proxy(...)`) is silently ignored — no error is thrown, the guard just never runs, and every `/admin/*` route hits Server Components unauthenticated. | Architecture | 🔴 Critical |
| 2026-06-18 | copilot/fix-auth-redirect-loop | GitHub Copilot | **Never use a browser-side Supabase `signInWithPassword()` + `router.push()` combo for protected admin routes.** The browser client writes session cookies via `document.cookie` which may not yet be present in the server request triggered by `router.push()` / `router.refresh()`. The result is a redirect loop. The only race-free pattern is a native HTML form POST to a server Route Handler that calls `signInWithPassword()` via `createServerClient` and writes cookies onto the **same 303 redirect response** — so the browser has the cookies before it ever requests the protected route. | Security | 🔴 Critical |
| 2026-06-18 | copilot/fix-auth-redirect-loop | GitHub Copilot | Every redirect returned from `middleware.ts` **must** copy refreshed Supabase cookies from `response` onto the redirect response. Supabase's `getUser()` may silently rotate tokens; if the subsequent redirect response doesn't carry those new cookies the rotated token is lost and the user is involuntarily logged out on the next request. The pattern is: `response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value))` — apply it to **every** redirect branch, not just the auth-failure branch. | Security | 🔴 Critical |
| 2026-06-18 | copilot/fix-auth-redirect-loop | GitHub Copilot | Dead CMS guard code that calls a removed API endpoint (`/api/auth`) and then runs `window.location.hash = ''` when the call fails is an invisible auth redirect that can bounce users out of the admin panel independently of the Supabase middleware. Always verify that legacy auth guards are completely unreachable (no import chain leads to them) before treating them as harmless. Remove them rather than leaving them as dead files. | Architecture | 🟠 High |
| 2026-06-18 | copilot/switch-to-client-authentication | GitHub Copilot | Supabase login flows that rely on a route handler redirect can still loop even when the route writes cookies, because middleware may run before the redirected request sees those Set-Cookie values. For admin login screens, browser-side `createBrowserClient` sign-in plus `router.push()`/`router.refresh()` is the reliable pattern when middleware must read the session immediately. | Debugging | 🟠 High |
| 2026-06-18 | copilot/fix-session-persistence | GitHub Copilot | In Supabase SSR with Next.js, `getUser()` can trigger a token refresh that writes new cookies into the `response` object. If a redirect (`NextResponse.redirect(...)`) is returned without copying those cookies over, the refreshed tokens are lost and the user is logged out on the next request. Always copy `response.cookies.getAll()` onto any redirect response created after calling `getUser()`. | Security | 🔴 Critical |
| 2026-06-18 | copilot/fix-session-persistence | GitHub Copilot | The `try/catch` around `setAll` in a shared `createClient()` is appropriate for pure Server Components (which cannot set cookies) but must NOT be used in Layouts or Server Actions. Provide two factory functions — one with the silent catch for SC read-only contexts and one without for writable contexts — to avoid silently dropping token refreshes. | Architecture | 🟠 High |
| 2026-06-18 | copilot/fix-login-cookies | GitHub Copilot | `createBrowserClient` from `@supabase/ssr` stores session tokens in `localStorage` only — it does **not** set HttpOnly cookies. `middleware.ts` reads `request.cookies`, so it never sees a browser-only session and redirects every request back to login. Always use `createServerClient` (from a `'use server'` action or Route Handler) for the initial sign-in so that Supabase writes the session tokens as HttpOnly cookies that middleware can read. | Security | 🔴 Critical |
| 2026-06-18 | copilot/fix-middleware | GitHub Copilot | Always pass-list both `/admin/login` and `/admin/logout` in the middleware guard. The logout route needs to be reachable by unauthenticated requests (token already cleared) otherwise the redirect loop makes logout impossible. | Security | 🟠 High |
| 2026-06-18 | copilot/fix-middleware-and-proxy-issue | GitHub Copilot | Next.js 16 fails the build when both root `middleware.ts` and `proxy.ts` exist at the same time. Keep only one entrypoint file; when migrating from proxy-based wiring, inline the full guard logic into `middleware.ts` and delete `proxy.ts`. | DevOps | 🔴 Critical |
| 2026-06-18 | copilot/fix-admin-redirect-loop | GitHub Copilot | In Supabase SSR middleware, `setAll` can fire during `auth.getUser()` and must be allowed to recreate the `NextResponse` with updated request headers; otherwise refreshed session cookies are lost. If the request then redirects (unauthenticated/forbidden/error), copy refreshed cookies onto the redirect response too, or stale browser cookies will trigger login loops on the next request. | Security | 🔴 Critical |
| 2026-06-18 | copilot/fix-release-overlay-issue | GitHub Copilot | During App Router migration, having a complete overlay component is not enough — every trigger path must be re-wired through a `'use client'` wrapper when the parent page is a Server Component. For release cards, this means passing an `onReleaseClick` callback from a client wrapper and mapping server-fetched records into the overlay union's exact `Release` shape before opening `CyberpunkOverlay`. | Architecture | 🟡 Medium |
| 2026-06-18 | copilot/security-cleanup | GitHub Copilot | Upstash Redis proxy methods can fail under TypeScript 5.9 when called as `kv.get<T>()` / `redis.get<T>()`. In API handlers, cast the awaited result instead (`(await kv.get(key)) as T | null`) so Vercel's stricter serverless build step accepts the code. | DevOps | 🟠 High |
| 2026-06-18 | copilot/security-cleanup | GitHub Copilot | In the App Router, a page and a route handler cannot live at the same path segment (`app/admin/login/page.tsx` + `app/admin/login/route.ts`). Keep the page route stable and move form POST handlers into a child segment like `/admin/login/submit` to avoid Turbopack route conflicts. | DevOps | 🟠 High |

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
| Architecture | 11 |
| Security | 9 |
| Performance | 4 |
| Dependencies | 1 |
| Testing | 1 |
| DevOps | 1 |
| Debugging | 1 |
| **Total** | **28** |

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

---

## Second Audit Pass — 6 Fixes (2026-05-26)

### XSS Parity Between Email Providers
When escaping HTML in server-generated emails, escaping must be applied in every code path that produces HTML output. In `contact.ts`, the Resend path used the `esc()` helper but the Brevo fallback path — written later — did not. The `esc()` function was module-private and accessible; the fix was a one-line change. **Lesson:** when adding a second implementation of the same operation, always copy the security invariants from the first, not just the functional logic. Tests should cover both code paths, not just the primary one.

### Error Messages Must Not Reach the Client
Forwarding `error.message` to HTTP 500 responses (e.g., `message: error instanceof Error ? error.message : 'Unknown error'`) leaks internal implementation details: DB connection strings, key names, internal function names. The fix is always a static generic string on the public-facing response; log the full error internally. **Lesson:** treat the `message` field of a 5xx response as a public API surface — it must never contain exception text.

### Dead Code Produces Real Overhead
`session.ts` had a fallback `kv.get('zd-session:${token}')` in the GET handler, with a comment claiming it accepted tokens from `auth.ts`. However, `auth.ts` has always stored sessions under `session:${token}`. The fallback was never reachable, yet it fired on every failed session lookup — one extra Redis RTT per unauthenticated request. **Lesson:** verify the actual key prefix used by the writer before adding a "migration" reader. Add a test that asserts only the expected keys are accessed.

### IntersectionObserver Cleanup: `disconnect()` not `unobserve()`
`observer.unobserve(element)` removes the element from the observation list but the `IntersectionObserver` object itself remains alive and holds a reference to its callback closure. `observer.disconnect()` fully terminates the observer and releases all references. In cleanup functions, always call `disconnect()` unless you specifically need to keep the observer running and just remove one element. **Lesson:** prefer `disconnect()` over `unobserve()` in `useEffect` cleanup unless you have multiple observed elements and want to remove just one.

### Image Preloader Hooks Need Unmount Guards
Creating `new Image()` with an `onload` callback inside `useEffect` without a cleanup is a classic React setState-after-unmount pattern. The fix is a single boolean `mounted` flag: set to `false` in the return cleanup function, checked inside `onload` before calling `setState`. **Lesson:** any async side effect that calls `setState` — including image loads, fetch responses, and timers — must check whether the component is still mounted before updating state.

### Array.pop() on Derived Strings Can Return Undefined
TypeScript correctly types `string[].pop()` as `string | undefined`. When `process.env.MAILCHIMP_API_KEY.split('-').pop()` is used as a URL segment, a malformed key (empty suffix or trailing dash) produces `''` or potentially `undefined`, building an invalid URL that is silently requested. TypeScript's template literal interpolation accepts `undefined` without error. **Lesson:** always null-guard the result of `.pop()` (and other array tail accessors) before using in a URL or string construction; log a descriptive error and skip the call rather than sending a malformed request.

---

## Semantic Utilities Sweep & Z-Index Hygiene (2026-06-06)

### Local Z-Index Tokens Must Replace All Raw Values Including Tailwind Bracket Classes
Tailwind's arbitrary-value syntax `z-[60]` or `z-[1]` generates a raw integer `z-index`, which is as much a violation of the z-index contract as an inline `zIndex: 9999`. The design system's `--z-local-above-1`, `--z-local-top`, and `--z-transition-fx` tokens must be used via `style={{ zIndex: 'var(--z-...)' } as React.CSSProperties}` because Tailwind has no way to reference CSS custom properties in z-index utilities. **Lesson:** when auditing z-index violations, search for BOTH `zIndex:` inline styles AND `z-[...]` Tailwind classes — the latter is equally prohibited.

### `--z-transition-fx` Is the Correct Layer for Fixed Pointer-Events-None Cursor Decorations
A custom cursor reticle (`position: fixed, pointer-events: none`) must be above every other layer including modals and system UI, because it tracks the pointer at all times. `--z-transition-fx: 70` is designed for exactly this ("must be above everything, pointer-events: none required"). Using `zIndex: 9999` would work visually but breaks the shared contract, preventing future layers from reasoning about ordering. **Lesson:** for any always-on-top, pointer-events-none overlay, reach for `--z-transition-fx` first.

### Semantic Typography Tokens Replace Breakpoint Pairs, Not Just Single Classes
The pattern `text-4xl md:text-6xl` is two classes: a base size for mobile and an overriding size for desktop. The semantic token `text-heading` (with a fluid `clamp()` value) replaces *both* in one class, and does so with continuous scaling rather than a discrete jump at the breakpoint. **Lesson:** when migrating to semantic typography tokens, always remove the accompanying `md:text-*` override — the fluid value covers both ends of the spectrum.

---

## Supabase + R2 + Next.js Public Frontend Migration (2026-06-16)

### next/font/google Requires Build-Time Network Access
`next/font/google` fetches font CSS from Google's CDN at build time (not just at runtime). In sandboxed CI or restricted network environments this fails the build entirely. The workaround is to load the font via a `<link>` tag in `app/layout.tsx`'s `<head>` — this is browser-loaded and never blocks the build. **Lesson:** use `next/font/google` only when build-time network access to fonts.googleapis.com is guaranteed; otherwise use `<link rel="stylesheet">` in layout or a self-hosted font with `next/font/local`.

### Partners Table with Category Field Avoids Table Proliferation
Credits, endorsements, and partners all share the same shape (name, logo, URL, display_order). Rather than creating three separate tables, a single `partners` table with a `category` column (`'credit' | 'endorsement' | 'partner'`) handles all three. RLS applies uniformly and the admin page just filters by category. **Lesson:** before creating a new table, check if an existing table with a discriminator column covers the use case identically.

### eslint-disable Comments Must Reference Existing Rules
An `// eslint-disable-next-line some/rule` comment where `some/rule` is not registered in the project's ESLint config causes a lint error ("Definition for rule was not found"). Remove the comment rather than disabling a non-existent rule. **Lesson:** always verify that an ESLint rule exists in the active config before adding a disable comment; the safer approach is to fix the underlying issue instead.

### Server Actions in `app/_actions/` Need Their Directory Created First
Next.js does not auto-create `app/_actions/` — attempting to create files there fails silently when the parent directory is missing. **Lesson:** always `mkdir -p` the target directory before creating files with automated tools.

### Scroll-Default Video: Change `=== 'scroll'` Guard to `!== 'loop'`
When making `scroll` the default video mode (previously `loop`), the `BackgroundStack.tsx` condition must be inverted from `backgroundVideoMode === 'scroll'` to `backgroundVideoMode !== 'loop'`. Using the positive check would leave existing settings (where the field is `undefined`) stuck in loop mode. **Lesson:** when changing a binary default, flip the condition rather than relying on the positive value check, so `undefined` inherits the new default correctly.

### Upload-Only Admin UI: Show Stored Filename as Read-Only Confirmation
Removing a URL text-input in favour of an upload-only button still needs to communicate the current stored URL to the admin. Extracting the filename with `url.split('/').pop()?.split('?')[0]` and rendering it as a small `<p>` element (truncated, with the full URL as `title`) gives confirmation without re-introducing an editable field.

| 2026-06-18 | copilot/backend-parity | GitHub Copilot | When porting backend patterns across repos, always check whether helper functions like `requireAdmin()` exist before importing them in new server actions — create them first if missing, mirroring the middleware auth logic (Supabase session + profile role check) so server actions have defence-in-depth. | Architecture | 🟠 High |
| 2026-06-18 | copilot/backend-parity | GitHub Copilot | Services for new entity types (soundpacks, merchandise, musicHighlights) must import schemas from `lib/schemas/` and demo data from `lib/mockData.ts` — not define them inline — to keep the single-source-of-truth principle intact and avoid drift between the service schema and the app-level Zod type. | Architecture | 🟡 Medium |
| 2026-06-18 | copilot/unify-auth-system-supabase | GitHub Copilot | Server Actions that are expected to return structured `{ error }` payloads must catch Supabase auth/configuration failures themselves; otherwise Next.js surfaces them as the generic "An unexpected response was received from the server" client error. | Debugging | 🟠 High |

| 2026-06-18 | copilot/schema-drift-ui-parity | GitHub Copilot | Schema drift between `supabase/migrations/` and `supabase/schema.sql` causes silent runtime errors (column-not-found, RLS policy failures). When both files are maintained in the same repo, always use `information_schema.columns` guards and idempotent `RENAME COLUMN` / `ALTER TABLE` blocks in bridge migrations so they can be re-run safely. | Architecture | 🔴 Critical |
| 2026-06-18 | copilot/schema-drift-ui-parity | GitHub Copilot | TypeScript's incremental build cache (`tsconfig.tsbuildinfo`) can mask pre-existing type errors: a fresh `tsc --noEmit` (after deleting the tsbuildinfo) may reveal zero new errors where an incremental run reports failures. Always delete `.tsbuildinfo` before diagnosing type errors after adding new files. | Debugging | 🟠 High |
| 2026-06-18 | copilot/schema-drift-ui-parity | GitHub Copilot | GDPR two-click rule: any external IFrame embed (Spotify, YouTube, SoundCloud) must gate the `<iframe>` behind an explicit user-click state. Never render the `src` attribute until the user has clicked a consent button — even if the parent page has cookie consent, the per-embed opt-in prevents IP leaks to third-party servers on page load. | Security | 🔴 Critical |
| 2026-06-18 | copilot/mobile-optimization | GitHub Copilot | Inline `require('@/alias/path')` inside test bodies is resolved via CommonJS and does NOT expand `@/` path aliases configured in `tsconfig.json`/`vitest.config.ts`. Always use top-level ESM `import` statements so that Vite's alias resolver runs at transform time. | Testing | 🟡 Medium |
| 2026-06-18 | copilot/mobile-optimization | GitHub Copilot | iOS Safari auto-zooms on input focus when `font-size < 16px`. Setting `text-base` (16px) on login/form inputs prevents this. Using `text-sm` (14px) is a common oversight that degrades the mobile auth experience silently — no error is thrown, the zoom just happens. | UX/a11y | 🟡 Medium |
| 2026-06-18 | copilot/mobile-optimization | GitHub Copilot | Tailwind custom breakpoints must go in `theme.extend.screens` (not `theme.screens`), otherwise they replace Tailwind's built-in `sm/md/lg/xl/2xl` breakpoints entirely. Adding `xs: '480px'` under `extend` preserves all existing breakpoints while enabling `xs:` prefix classes. | Architecture | 🟢 Low |
| 2026-06-18 | copilot/cookie-chunking-fix | GitHub Copilot | A single Supabase auth cookie can exceed the browser's ~4 KB per-cookie limit and be silently dropped, leaving only a 34-byte empty stub. Never override `@supabase/ssr`'s cookie options (e.g. hardcoding `httpOnly`/`secure` before `...options`) in a Route Handler's `setAll` callback — pass the library's `options` through unchanged so large tokens are split into `sb-…-auth-token.0`/`.1` chunk cookies each well under the limit. The canonical correct pattern is `response.cookies.set(name, value, options)`, mirroring `middleware.ts`. | Security | 🔴 Critical |
