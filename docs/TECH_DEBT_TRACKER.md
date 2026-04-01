# Technical Debt Register — Zardonic Industrial

> **Last Updated:** 2026-04-01  
> **Agent ID:** copilot/deep-audit-dokumentation  

---

## Overview

This document tracks all known technical debt items. Each item has a unique ID, severity, estimated effort, business impact, and current status.

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low  
**Effort:** XS (<1h) / S (1–4h) / M (4–8h) / L (1–3d) / XL (>3d)  
**Status:** 🔴 Open / 🔄 In Progress / ✅ Resolved / ❌ Wont Fix  

---

## Priority 1 — Critical

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-001 | `App.tsx` God Object (3 638 lines) — entire app state and UI in one file | 🔴 | XL | Every new feature causes merge conflicts; onboarding impossible | 🔴 Open | [A-01](./DEEP_AUDIT.md#a-01) |
| TD-002 | `tsc --noCheck` in build script — TypeScript errors silently pass to production | 🔴 | XS | Type errors in production; runtime crashes | 🔴 Open | [B-03](./DEEP_AUDIT.md#b-03) |

---

## Priority 2 — High

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-003 | Hardcoded default `RATE_LIMIT_SALT` in `middleware.ts` | 🟠 | XS | IP anonymisation bypassed if env var not set | 🔴 Open | [B-01](./DEEP_AUDIT.md#b-01) |
| TD-004 | CSP allows `'unsafe-inline'` for styles (`vercel.json`) | 🟠 | S | CSS injection attack vector | 🔴 Open | [B-02](./DEEP_AUDIT.md#b-02) |
| TD-005 | Near-zero test coverage — critical paths untested | 🟠 | XL | Regressions undetected; deploy confidence low | 🔴 Open | [D-01](./DEEP_AUDIT.md#d-01) |
| TD-006 | `next-themes` incompatible with Vite/React SPA | 🟠 | S | Potential hydration issues; wrong package | 🔴 Open | [F-02](./DEEP_AUDIT.md#f-02) |
| TD-007 | 7 unmerged Dependabot PRs (security patches pending) | 🟠 | M | Known vulnerabilities unpatched | 🔴 Open | [F-01](./DEEP_AUDIT.md#f-01) |
| TD-008 | JS obfuscation in build pipeline — 30–80% bundle size increase | 🟠 | S | Poor Core Web Vitals; security-through-obscurity | 🔴 Open | [G-01](./DEEP_AUDIT.md#g-01) |
| TD-009 | No `prefers-reduced-motion` support — accessibility risk | 🟠 | M | WCAG 2.1 AA violation; epilepsy/vestibular risk | 🔴 Open | [C-01](./DEEP_AUDIT.md#c-01) |
| TD-010 | ESLint ignores entire `api/` directory | 🟠 | XS | Security-critical code has no static analysis | 🔴 Open | [B-04](./DEEP_AUDIT.md#b-04) |
| TD-011 | `EditControls.tsx` — 1 007 lines, too much responsibility | 🟠 | L | Hard to test; frequent merge conflicts | 🔴 Open | [A-02](./DEEP_AUDIT.md#a-02) |

---

## Priority 3 — Medium

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-012 | No client-side router — no URL navigation | 🟡 | L | No deep-linking, no browser history, no code splitting | 🔴 Open | [A-06](./DEEP_AUDIT.md#a-06) |
| TD-013 | No state management library — prop-drilling throughout | 🟡 | L | Increasing complexity; re-render performance issues | 🔴 Open | [A-05](./DEEP_AUDIT.md#a-05) |
| TD-014 | Only 1 root-level `ErrorBoundary` — any error crashes entire page | 🟡 | M | Poor user experience on partial errors | 🔴 Open | [E-04](./DEEP_AUDIT.md#e-04) |
| TD-015 | `ThemeCustomizerDialog.tsx` — 795 lines | 🟡 | M | Hard to maintain; monolithic dialog | 🔴 Open | [A-02](./DEEP_AUDIT.md#a-02) |
| TD-016 | Flat component directory — 70+ files without structure | 🟡 | S | Discoverability poor; no feature isolation | 🔴 Open | [A-03](./DEEP_AUDIT.md#a-03) |
| TD-017 | Only `LocaleContext` — auth/theme state not in contexts | 🟡 | M | Prop-drilling for auth/theme state | 🔴 Open | [A-04](./DEEP_AUDIT.md#a-04) |
| TD-018 | Missing `strict: true` in `tsconfig.json` | 🟡 | XS | Weaker type safety | 🔴 Open | [B-05](./DEEP_AUDIT.md#b-05) |
| TD-019 | No barrel exports (`index.ts`) in components/hooks/lib | 🟡 | S | Verbose imports; refactoring harder | 🔴 Open | [A-08](./DEEP_AUDIT.md#a-08) |
| TD-020 | Three icon libraries in use (`heroicons`, `phosphor`, `lucide`) | 🟡 | M | Bundle bloat; visual inconsistency | 🔴 Open | [F-03](./DEEP_AUDIT.md#f-03) |
| TD-021 | No lazy loading for heavy components (Three.js, D3, Recharts) | 🟡 | M | Slow initial page load; poor LCP | 🔴 Open | [G-02](./DEEP_AUDIT.md#g-02) |
| TD-022 | `middleware.ts` creates new Redis client per request | 🟡 | XS | Unnecessary object allocation on Edge | 🔴 Open | [A-09](./DEEP_AUDIT.md#a-09) |
| TD-023 | Missing skip-to-content link | 🟡 | XS | WCAG 2.1 AA violation | 🔴 Open | [C-02](./DEEP_AUDIT.md#c-02) |
| TD-024 | `CookieBanner.tsx` + `CookieConsent.tsx` — duplicated cookie UI | 🟡 | S | Confusing UX; inconsistent consent state | 🔴 Open | [A-07](./DEEP_AUDIT.md#a-07) |
| TD-025 | Legacy `x-session-token` header — XSS-vulnerable session transport | 🟡 | M | XSS can exfiltrate session token | 🔴 Open | [B-08](./DEEP_AUDIT.md#b-08) |
| TD-026 | Image proxy DNS pre-resolution timing — SSRF risk | 🟡 | M | DNS rebinding could bypass SSRF protection | 🔴 Open | [B-06](./DEEP_AUDIT.md#b-06) |
| TD-027 | Unix-only build script (`export NODE_OPTIONS=`) — Windows broken | 🟡 | XS | Windows developers cannot build | 🔴 Open | [D-05](./DEEP_AUDIT.md#d-05) |

---

## Priority 4 — Low

| ID | Title | Severity | Effort | Impact | Status | Ref |
|----|-------|----------|--------|--------|--------|-----|
| TD-028 | Version `0.0.0` in `package.json` — no SemVer | 🟢 | XS | No release history | 🔴 Open | [D-03](./DEEP_AUDIT.md#d-03) |
| TD-029 | No `CHANGELOG.md` | 🟢 | XS | No release notes for users/contributors | 🔴 Open | [D-04](./DEEP_AUDIT.md#d-04) |
| TD-030 | No barrel index files (`index.ts`) for components/hooks/lib | 🟢 | S | Verbose, brittle import paths | 🔴 Open | [A-08](./DEEP_AUDIT.md#a-08) |
| TD-031 | `index.css` — 1 990 lines, not split by concern | 🟢 | M | Hard to find styles; accidental overrides | 🔴 Open | [A-10](./DEEP_AUDIT.md#a-10) |
| TD-032 | ARIA labels not translated (i18n gap) | 🟢 | S | Accessibility gap for non-English screen reader users | 🔴 Open | [C-06](./DEEP_AUDIT.md#c-06) |
| TD-033 | No responsive breakpoint test coverage | 🟢 | M | Layout regressions go undetected | 🔴 Open | [C-05](./DEEP_AUDIT.md#c-05) |
| TD-034 | Magic numbers in `middleware.ts` (`THRESHOLD=500`, `COOLDOWN_SECONDS=300`) | 🟢 | XS | Not configurable; unclear meaning | 🔴 Open | [E-03](./DEEP_AUDIT.md#e-03) |

---

## Resolved Items

| ID | Title | Resolved Date | Agent |
|----|-------|---------------|-------|
| — | — | — | — |

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | All open |
| 🟠 High | 9 | All open |
| 🟡 Medium | 16 | All open |
| 🟢 Low | 7 | All open |
| **Total** | **34** | **All open** |

---

## Process Notes

- Items are prioritised by Severity → Impact → Effort (lowest effort for highest impact = quick wins)
- Items marked `✅ Resolved` should include the PR number that resolved them
- Do not delete resolved items; they serve as an audit trail
- When resolving a TD item, also update `docs/DEVELOPMENT_STATUS.md`
