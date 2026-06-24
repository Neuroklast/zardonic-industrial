# Technical Debt Register — Zardonic Industrial

> **Last Updated:** 2026-06-24 (pre-launch sprint)

---

## Overview

Known technical debt with severity, effort, and status. Historical Vite-only items are marked **Superseded** after the App Router migration (ADR-007).

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low  
**Effort:** XS (<1h) / S (1–4h) / M (4–8h) / L (1–3d) / XL (>3d)  
**Status:** 🔴 Open / 🔄 In Progress / ✅ Resolved / ❌ Superseded / ⏸️ Accepted / ❌ Wont Fix

Audit references point to [archive/2026-04-vite-audit/DEEP_AUDIT.md](./archive/2026-04-vite-audit/DEEP_AUDIT.md) (historical).

---

## Priority 1 — Critical

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-001 | `App.tsx` God Object | 🔴 | XL | Merge conflicts, onboarding | ✅ Resolved | ADR-007 |
| TD-002 | `tsc --noCheck` in build | 🔴 | XS | Type errors in production | ✅ Resolved | — |

---

## Priority 2 — High

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-003 | Hardcoded default `RATE_LIMIT_SALT` | 🟠 | XS | IP anonymisation bypass | ✅ Resolved | `api/_ratelimit.ts` throws in production without env |
| TD-004 | CSP `'unsafe-inline'` styles | 🟠 | S | CSS injection vector | ⏸️ Accepted | Tailwind + inline theme vars require it; documented in `SECURITY.md` |
| TD-005 | Near-zero test coverage | 🟠 | XL | Regressions undetected | ✅ Resolved | Vitest suite (700+ tests) |
| TD-006 | `next-themes` incompatible with Vite SPA | 🟠 | S | Wrong package for Vite | ❌ Superseded | App Router uses Next.js |
| TD-007 | Unmerged Dependabot PRs / transitive CVEs | 🟠 | M | Known vulnerabilities | 🔄 In Progress | CI `npm audit --audit-level=high`; `undici` override bumped; moderate `postcss`/`js-yaml` via Next/@vercel/node — monitor upstream |
| TD-008 | JS obfuscation in build | 🟠 | S | Bundle bloat | ❌ Superseded | Vite pipeline removed; Next.js build has no obfuscation step |
| TD-009 | No `prefers-reduced-motion` | 🟠 | M | WCAG risk | ✅ Resolved | CSS global rule + Framer `useReducedMotion` in public sections |
| TD-010 | ESLint ignores `api/` | 🟠 | XS | No static analysis on APIs | ✅ Resolved | `eslint.config.mjs` lints `api/` |
| TD-011 | `EditControls.tsx` monolith | 🟠 | L | Hard to test | ❌ Superseded | Legacy CMS removed; admin is `app/admin/*` |
| TD-035 | Legal pages missing | 🟠 | M | Footer 404 / compliance | ✅ Resolved | `/legal-notice`, `/privacy-policy` |

---

## Priority 3 — Medium

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-012 | No client-side router | 🟡 | L | No deep-linking | ❌ Superseded | Next.js App Router |
| TD-013 | No state management library | 🟡 | L | Prop-drilling | 🔄 In Progress | RSC + server actions; acceptable for launch |
| TD-014 | Single root `ErrorBoundary` | 🟡 | M | Full-page crash | ✅ Resolved | Per-section `SectionErrorBoundary` on `app/page.tsx` |
| TD-015 | `ThemeCustomizerDialog.tsx` size | 🟡 | M | Hard to maintain | ❌ Superseded | Dialog removed; tabs live under `components/theme-customizer/` + admin appearance |
| TD-016 | Flat component directory | 🟡 | S | Poor discoverability | ✅ Resolved | `components/README.md` + `app/_components/public/` split |
| TD-017 | Auth/theme not in contexts | 🟡 | M | Prop-drilling | ❌ Superseded | Supabase SSR sessions |
| TD-018 | Missing `strict: true` in tsconfig | 🟡 | XS | Weaker types | ✅ Resolved | `tsconfig.json` `strict: true` |
| TD-019 | No barrel exports | 🟡 | S | Verbose imports | ❌ Wont Fix | Post-launch ergonomics; explicit paths preferred for tree-shaking |
| TD-020 | Three icon libraries | 🟡 | M | Bundle bloat | 🔴 Open | Lucide + Phosphor + Radix icons — consolidate post-launch (ADR-005) |
| TD-021 | No lazy loading (Three.js, etc.) | 🟡 | M | Poor LCP | 🔴 Open | `ModelBackground` / heavy effects — defer until perf budget defined |
| TD-022 | Redis client per request | 🟡 | XS | Edge waste | 🔴 Open | `api/_redis.ts` — singleton refactor when touching rate limits |
| TD-023 | Missing skip-to-content link | 🟡 | XS | WCAG | ✅ Resolved | `PageLayout` |
| TD-024 | Duplicate cookie UI | 🟡 | S | Confusing UX | ✅ Resolved | `CookieConsent` only |
| TD-025 | Legacy `x-session-token` header | 🟡 | M | XSS session theft | ✅ Resolved | `api/auth.ts` removed; Supabase HttpOnly cookies only |
| TD-026 | Image proxy DNS timing | 🟡 | M | SSRF risk | ✅ Resolved | `lib/ssrf-guard.ts` — resolve + pin before fetch |
| TD-027 | Unix-only build script | 🟡 | XS | Windows broken | ⏸️ Accepted | `scripts/fix-deps.sh` optional; primary workflow is `npm run *` (cross-platform) |

---

## Priority 4 — Low

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-028 | Version `0.0.0` in package.json | 🟢 | XS | No SemVer | ✅ Resolved | Now `1.0.0` |
| TD-029 | No CHANGELOG | 🟢 | XS | No release notes | ✅ Resolved | CHANGELOG.md |
| TD-030 | No barrel index files | 🟢 | S | Brittle imports | ❌ Wont Fix | Same as TD-019 |
| TD-031 | `index.css` monolith | 🟢 | M | Hard to navigate | 🔴 Open | Post-launch CSS module split |
| TD-032 | ARIA labels not translated | 🟢 | S | i18n gap | ✅ Resolved | `lib/i18n.ts` `aria.*` keys + `ariaLabel()`; `SiteNav` localized |
| TD-033 | No responsive test coverage | 🟢 | M | Layout regressions | ✅ Resolved | `admin-mobile.test.tsx`, `public-mobile.test.tsx` |
| TD-036 | Vitest localStorage broken on Node 22+ | 🟠 | XS | 98 test failures | ✅ Resolved | `src/test/setup.ts` Storage mock |
| TD-034 | Magic numbers in middleware | 🟢 | XS | Not configurable | ✅ Resolved | Named constants in `api/_ratelimit.ts` |

---

## Resolved / superseded summary

| ID | Resolution | Date |
|----|------------|------|
| TD-001 | Next.js App Router migration | 2026-06-18 |
| TD-002 | Strict `tsc --noEmit` | 2026-06-18 |
| TD-005 | Vitest suite expanded | 2026-06-18 |
| TD-006 | Vite SPA obsolete | 2026-06-24 |
| TD-008 | Obfuscation step removed with Vite | 2026-06-24 |
| TD-009 | Reduced-motion global + section hooks | 2026-06-24 |
| TD-010 | ESLint covers `api/` | 2026-06-24 |
| TD-011 | Legacy CMS / EditControls deleted | 2026-06-24 |
| TD-012 | Next.js file-based routing | 2026-06-24 |
| TD-014 | Per-section error boundaries | 2026-06-24 |
| TD-015 | ThemeCustomizerDialog removed | 2026-06-24 |
| TD-016 | `components/README.md` | 2026-06-24 |
| TD-017 | Supabase SSR auth | 2026-06-24 |
| TD-018 | `strict: true` enabled | 2026-06-24 |
| TD-023 | Skip link in PageLayout | 2026-06-24 |
| TD-024 | Single CookieConsent | 2026-06-24 |
| TD-025 | Legacy session header removed | 2026-06-24 |
| TD-026 | SSRF guard on image proxies | 2026-06-24 |
| TD-028 | package.json `1.0.0` | 2026-06-24 |
| TD-029 | CHANGELOG maintained | 2026-06-18 |
| TD-032 | Localized ARIA helpers | 2026-06-24 |
| TD-033 | Mobile regression tests | 2026-06-24 |
| TD-034 | Rate-limit constants extracted | 2026-06-24 |
| TD-035 | Legal pages + Supabase config | 2026-06-24 |
| TD-036 | Vitest Storage mock in setup | 2026-06-24 |

---

## Summary

| Priority | Total | Open | Resolved / Superseded / Accepted |
|----------|-------|------|----------------------------------|
| 🔴 Critical | 2 | 0 | 2 |
| 🟠 High | 11 | 1 | 10 |
| 🟡 Medium | 16 | 3 | 13 |
| 🟢 Low | 7 | 1 | 6 |
| **Total** | **36** | **5** | **31** |

**Launch blockers:** none. Remaining open items are post-launch perf/ergonomics (TD-020, TD-021, TD-022, TD-031) or upstream dependency monitoring (TD-007).

---

## Process

- Prioritise: Severity → Impact → Effort
- Do not delete resolved items — audit trail
- Update `docs/DEVELOPMENT_STATUS.md` when resolving items