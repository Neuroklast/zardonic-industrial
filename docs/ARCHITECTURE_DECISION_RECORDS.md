# Architecture Decision Records — Zardonic Industrial

**Last updated:** 2026-06-24  
**Current stack:** Next.js 16 App Router · Supabase · Cloudflare R2

## Overview

ADRs document significant architectural decisions. Historical Vite/React Router ADRs are marked **Superseded** — do not implement them.

**Status:** `Proposed` | `Accepted` | `Deprecated` | `Superseded`

---

## ADR-007: Next.js App Router + Supabase (current)

**Status:** Accepted  
**Date:** 2026-06-18  
**Supersedes:** ADR-001, ADR-002, ADR-003

### Context

The Vite SPA (`src/App.tsx` God Object, no router, KV-first CMS) blocked maintainability, deep-linking, and typed server mutations.

### Decision

- **Framework:** Next.js App Router (`app/`) with React Server Components where appropriate
- **Content:** Supabase PostgreSQL (`releases`, `gigs`, `site_config`, …)
- **Media:** Cloudflare R2 via presigned uploads
- **Admin auth:** Supabase Auth + `profiles.role = 'admin'`
- **Legal:** `site_config.legal` only — pages `/legal-notice`, `/privacy-policy`
- **Legacy:** `api/` + Upstash Redis retained for security/sync until migrated

### Consequences

- Easier: Deep links, server actions, typed data layer, per-route code splitting
- Harder: Dual `src/` mirror during migration; CSP parity between `vercel.json` and `next.config.mjs`

---

## ADR-001: Decompose Monolithic `App.tsx`

**Status:** Superseded by ADR-007  
**Date:** 2026-04-01

Vite SPA decomposition via React Router. Resolved by App Router migration (each section is its own route/component).

---

## ADR-002: State Management (Zustand)

**Status:** Superseded by ADR-007  
**Date:** 2026-04-01

Global Zustand stores for Vite SPA. Current app uses React state, server components, and Supabase fetches instead.

---

## ADR-003: Routing Strategy (React Router v7)

**Status:** Superseded by ADR-007  
**Date:** 2026-04-01

React Router with clean URLs. Replaced by Next.js file-based routing:

```
/                 → Home
/legal-notice     → Legal Notice
/privacy-policy   → Privacy Policy
/admin/*          → Admin (Supabase Auth)
/impressum, /privacy, /datenschutz → 301 redirects
```

---

## ADR-004: Offensive Security Features

**Status:** Proposed (requires legal review)  
**Date:** 2026-04-01

Active countermeasures (`_zipbomb.ts`, `_sql-backfire.ts`, etc.) may carry legal risk in EU/US. Obtain legal review before expanding. Defensive features (honeypots, hashed-IP profiling) continue.

---

## ADR-005: Dependency Consolidation (Icon Libraries)

**Status:** Proposed  
**Date:** 2026-04-01

Three icon libraries (`heroicons`, `phosphor`, `lucide`). Prefer **Lucide** for shadcn/ui alignment; migrate incrementally.

---

## ADR-006: Testing Strategy

**Status:** Accepted (in progress)  
**Date:** 2026-04-01

| Layer | Tool | Target |
|-------|------|--------|
| Unit | Vitest | `lib/` utilities |
| Component | Vitest + Testing Library | Critical UI |
| E2E | Playwright | Admin login, contact, newsletter (planned) |

---

*New ADRs: add at the bottom with sequential IDs (ADR-008, …). Mark superseded ADRs; do not delete.*