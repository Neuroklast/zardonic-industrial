# Technical Debt Register — Zardonic Industrial

> **Last Updated:** 2026-06-24

---

## Overview

Known technical debt with severity, effort, and status. Historical Vite-only items are marked **Superseded** after the App Router migration (ADR-007).

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low  
**Effort:** XS (<1h) / S (1–4h) / M (4–8h) / L (1–3d) / XL (>3d)  
**Status:** 🔴 Open / 🔄 In Progress / ✅ Resolved / ❌ Superseded / ❌ Wont Fix

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
| TD-003 | Hardcoded default `RATE_LIMIT_SALT` | 🟠 | XS | IP anonymisation bypass | 🔴 Open | [B-01](./archive/2026-04-vite-audit/DEEP_AUDIT.md#b-01) |
| TD-004 | CSP `'unsafe-inline'` styles | 🟠 | S | CSS injection vector | 🔴 Open | [B-02](./archive/2026-04-vite-audit/DEEP_AUDIT.md#b-02) |
| TD-005 | Near-zero test coverage | 🟠 | XL | Regressions undetected | ✅ Resolved | — |
| TD-006 | `next-themes` incompatible with Vite SPA | 🟠 | S | Wrong package for Vite | ❌ Superseded | App Router uses Next.js |
| TD-007 | Unmerged Dependabot PRs | 🟠 | M | Known vulnerabilities | 🔴 Open | [F-01](./archive/2026-04-vite-audit/DEEP_AUDIT.md#f-01) |
| TD-008 | JS obfuscation in build | 🟠 | S | Bundle bloat | 🔴 Open | [G-01](./archive/2026-04-vite-audit/DEEP_AUDIT.md#g-01) |
| TD-009 | No `prefers-reduced-motion` | 🟠 | M | WCAG risk | 🔴 Open | [C-01](./archive/2026-04-vite-audit/DEEP_AUDIT.md#c-01) |
| TD-010 | ESLint ignores `api/` | 🟠 | XS | No static analysis on APIs | 🔴 Open | [B-04](./archive/2026-04-vite-audit/DEEP_AUDIT.md#b-04) |
| TD-011 | `EditControls.tsx` monolith | 🟠 | L | Hard to test | 🔴 Open | [A-02](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-02) |
| TD-035 | Legal pages missing | 🟠 | M | Footer 404 / compliance | ✅ Resolved | `/legal-notice`, `/privacy-policy` |

---

## Priority 3 — Medium

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-012 | No client-side router | 🟡 | L | No deep-linking | ❌ Superseded | Next.js App Router |
| TD-013 | No state management library | 🟡 | L | Prop-drilling | 🔄 In Progress | RSC + server state |
| TD-014 | Single root `ErrorBoundary` | 🟡 | M | Full-page crash | 🔴 Open | [E-04](./archive/2026-04-vite-audit/DEEP_AUDIT.md#e-04) |
| TD-015 | `ThemeCustomizerDialog.tsx` size | 🟡 | M | Hard to maintain | 🔴 Open | [A-02](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-02) |
| TD-016 | Flat component directory | 🟡 | S | Poor discoverability | 🔴 Open | [A-03](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-03) |
| TD-017 | Auth/theme not in contexts | 🟡 | M | Prop-drilling | ❌ Superseded | Supabase SSR sessions |
| TD-018 | Missing `strict: true` in tsconfig | 🟡 | XS | Weaker types | 🔴 Open | [B-05](./archive/2026-04-vite-audit/DEEP_AUDIT.md#b-05) |
| TD-019 | No barrel exports | 🟡 | S | Verbose imports | 🔴 Open | [A-08](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-08) |
| TD-020 | Three icon libraries | 🟡 | M | Bundle bloat | 🔴 Open | ADR-005 |
| TD-021 | No lazy loading (Three.js, etc.) | 🟡 | M | Poor LCP | 🔴 Open | [G-02](./archive/2026-04-vite-audit/DEEP_AUDIT.md#g-02) |
| TD-022 | Redis client per request | 🟡 | XS | Edge waste | 🔴 Open | [A-09](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-09) |
| TD-023 | Missing skip-to-content link | 🟡 | XS | WCAG | ✅ Resolved | `PageLayout` |
| TD-024 | Duplicate cookie UI | 🟡 | S | Confusing UX | ✅ Resolved | `CookieConsent` only |
| TD-025 | Legacy `x-session-token` header | 🟡 | M | XSS session theft | 🔴 Open | Legacy `api/` only |
| TD-026 | Image proxy DNS timing | 🟡 | M | SSRF risk | 🔴 Open | [B-06](./archive/2026-04-vite-audit/DEEP_AUDIT.md#b-06) |
| TD-027 | Unix-only build script | 🟡 | XS | Windows broken | 🔴 Open | [D-05](./archive/2026-04-vite-audit/DEEP_AUDIT.md#d-05) |

---

## Priority 4 — Low

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-028 | Version `0.0.0` in package.json | 🟢 | XS | No SemVer | ✅ Resolved | Now `1.0.0` |
| TD-029 | No CHANGELOG | 🟢 | XS | No release notes | ✅ Resolved | CHANGELOG.md |
| TD-030 | No barrel index files | 🟢 | S | Brittle imports | 🔴 Open | [A-08](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-08) |
| TD-031 | `index.css` monolith | 🟢 | M | Hard to navigate | 🔴 Open | [A-10](./archive/2026-04-vite-audit/DEEP_AUDIT.md#a-10) |
| TD-032 | ARIA labels not translated | 🟢 | S | i18n gap | 🔴 Open | [C-06](./archive/2026-04-vite-audit/DEEP_AUDIT.md#c-06) |
| TD-033 | No responsive test coverage | 🟢 | M | Layout regressions | 🔄 In Progress | `admin-mobile.test.tsx`; mobile overlay/carousel fixes |
| TD-036 | Vitest localStorage broken on Node 22+ | 🟠 | XS | 98 test failures | ✅ Resolved | `src/test/setup.ts` Storage mock |
| TD-034 | Magic numbers in middleware | 🟢 | XS | Not configurable | 🔴 Open | [E-03](./archive/2026-04-vite-audit/DEEP_AUDIT.md#e-03) |

---

## Resolved / superseded summary

| ID | Resolution | Date |
|----|------------|------|
| TD-001 | Next.js App Router migration | 2026-06-18 |
| TD-002 | Strict `tsc --noEmit` | 2026-06-18 |
| TD-005 | Vitest suite expanded | 2026-06-18 |
| TD-006 | Vite SPA obsolete | 2026-06-24 |
| TD-012 | Next.js file-based routing | 2026-06-24 |
| TD-017 | Supabase SSR auth | 2026-06-24 |
| TD-023 | Skip link in PageLayout | 2026-06-24 |
| TD-024 | Single CookieConsent | 2026-06-24 |
| TD-028 | package.json `1.0.0` | 2026-06-24 |
| TD-029 | CHANGELOG maintained | 2026-06-18 |
| TD-035 | Legal pages + Supabase config | 2026-06-24 |
| TD-036 | Vitest Storage mock in setup | 2026-06-24 |

---

## Summary

| Priority | Total | Open | Resolved / Superseded |
|----------|-------|------|------------------------|
| 🔴 Critical | 2 | 0 | 2 |
| 🟠 High | 11 | 7 | 4 |
| 🟡 Medium | 16 | 11 | 5 |
| 🟢 Low | 7 | 5 | 2 |
| **Total** | **36** | **22** | **14** |

---

## Process

- Prioritise: Severity → Impact → Effort
- Do not delete resolved items — audit trail
- Update `docs/DEVELOPMENT_STATUS.md` when resolving items