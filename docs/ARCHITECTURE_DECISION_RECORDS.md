# Architecture Decision Records — Zardonic Industrial

> **Last Updated:** 2026-04-01  
> **Agent ID:** copilot/deep-audit-dokumentation  

---

## Overview

This document records Architecture Decision Records (ADRs) for the Zardonic Industrial website. Each ADR documents a significant architectural decision: the context, the options considered, the decision made, and the rationale.

**Status values:** `Proposed` | `Accepted` | `Deprecated` | `Superseded`

---

## ADR Template

```markdown
## ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN  
**Date:** YYYY-MM-DD  
**Author:** Agent ID  

### Context
What is the problem? What forces are at play?

### Options Considered
1. Option A — pros/cons
2. Option B — pros/cons

### Decision
Which option was chosen and why.

### Consequences
What becomes easier? What becomes harder?
```

---

## ADR-001: Decompose Monolithic `App.tsx`

**Status:** Proposed  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

`src/App.tsx` has grown to 3 638 lines (196 961 bytes). It contains every piece of application state, every dialog, every section, and the entire layout. This is a God Object anti-pattern. Every feature addition requires editing this file, creating constant merge conflicts and making the codebase increasingly hard to understand.

### Options Considered

1. **Feature-based modules** — reorganise into `src/features/{admin,sections,security}/` with co-located components, hooks, and types. Each feature owns its own state and renders itself.  
   *Pros:* Clean boundaries, easy to test, easy to delete a feature  
   *Cons:* Large upfront refactor; risk of breakage

2. **Extract to smaller components only** — keep `App.tsx` as orchestrator but break out large components  
   *Pros:* Lower risk; incremental  
   *Cons:* `App.tsx` still bloated; prop-drilling remains

3. **Introduce Router + lazy routes** — use React Router to split the app by page/section; each route is a separate chunk  
   *Pros:* Natural split; improves performance via code splitting  
   *Cons:* Requires URL-structure design upfront

### Decision

**Adopt option 3 (React Router) as the foundation, then option 1 (feature modules) incrementally.**

Start by introducing React Router v7. Each major section (`/bio`, `/releases`, `/gigs`, `/gallery`, `/contact`) becomes a lazy-loaded route. This naturally forces decomposition of `App.tsx` into route-level components.

Then, within each route component, apply the feature-module pattern: `src/features/{section}/` with co-located component, hooks, and types.

### Consequences

- Easier: Testing (each feature is isolated), code splitting, onboarding, deletion of features
- Harder: Initial refactor is large; existing state in `App.tsx` must be migrated to contexts or Zustand

---

## ADR-002: State Management

**Status:** Proposed  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

All application state currently lives in `App.tsx` as `useState`/`useRef` hooks. As the feature set has grown, this creates:
- Excessive prop-drilling (passing state and setters through 3–5 component levels)
- Re-renders of the entire tree on any state change
- No separation between global state (theme, auth, site config) and local UI state

### Options Considered

1. **Zustand** — lightweight (~2 KB), idiomatic with React hooks, works well with Vite, supports middleware  
   *Pros:* Minimal boilerplate, easy testing, composable stores  
   *Cons:* Another dependency

2. **React Context + useReducer** — no extra dependency, built into React  
   *Pros:* Zero dependencies  
   *Cons:* Verbose; contexts cause excessive re-renders without careful splitting; doesn't scale to complex state

3. **Jotai / Recoil** — atomic state model  
   *Pros:* Fine-grained reactivity  
   *Cons:* Less mainstream; smaller ecosystem

4. **Redux Toolkit** — industry standard for complex apps  
   *Pros:* Mature, great DevTools  
   *Cons:* Over-engineered for this app size; heavy boilerplate

### Decision

**Adopt Zustand** for global state (auth session, theme, site config, admin state).

Keep React `useState` for local UI state (open/closed dialogs, form values).

### Consequences

- Easier: Components can access global state without prop-drilling; stores are independently testable
- Harder: Must migrate existing `App.tsx` state incrementally; new dependency

---

## ADR-003: Routing Strategy

**Status:** Proposed  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

The current SPA has no client-side router. All navigation is done via conditional rendering inside `App.tsx`. This means:
- No bookmarkable URLs
- No browser back/forward support
- No deep-linking to specific sections
- All code is bundled and loaded upfront

### Options Considered

1. **React Router v7 (with hash routing)** — preserve current single-page feel using `#/bio`, `#/releases`  
   *Pros:* Simple; no server config changes needed  
   *Cons:* Hash URLs are ugly; poor SEO

2. **React Router v7 (with history API)** — clean URLs (`/bio`, `/releases`, `/admin`)  
   *Pros:* Clean URLs; SEO-friendly; industry standard  
   *Cons:* Vercel must be configured to serve `index.html` for all routes (already handled by SPA config)

3. **TanStack Router** — type-safe routing  
   *Pros:* Full TypeScript integration  
   *Cons:* Newer; smaller community; would require rewrite from scratch

### Decision

**Adopt React Router v7 with history API (clean URLs).**

Route structure:
```
/                 → Home (Hero + sections)
/bio              → Biography section
/releases         → Releases section
/gigs             → Gigs/Tour section
/gallery          → Instagram gallery
/contact          → Contact form
/admin            → Admin panel (protected)
/impressum        → Legal page
/datenschutz      → Privacy policy
```

Vercel's existing SPA handling already serves `index.html` for all paths.

### Consequences

- Easier: Deep-linking, SEO, code splitting, testing individual sections
- Harder: Admin panel URL handling must be secured; scroll restoration must be implemented

---

## ADR-004: Offensive Security Features

**Status:** Proposed (Requires Legal Review)  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

The repository contains several active countermeasure files:
- `api/_zipbomb.ts` — serves compressed zipbombs to malicious crawlers
- `api/_sql-backfire.ts` — injects false SQL responses to SQL injection attempts
- `api/_log-poisoning.ts` — poisons attacker log files with false data
- `api/_canary-documents.ts` — embeds tracking tokens in served documents
- `api/_honeytokens.ts` — tracks attacker fingerprints via pixel tokens
- `api/_attacker-profile.ts` — builds persistent profiles of attacking IPs

These features are innovative and technically impressive. However, they raise legal concerns.

### Legal Considerations

| Jurisdiction | Risk |
|---|---|
| Germany / EU | Active countermeasures may violate §202c StGB (Vorbereitung einer Straftat) or GDPR (data collection without consent) |
| United States | CFAA (18 U.S.C. § 1030) prohibits "exceeding authorised access" on computer systems; active countermeasures are a grey area |
| General | Serving zipbombs could be construed as a DoS attack on the attacker's infrastructure |

### Options Considered

1. **Keep all features** — accept the risk; attacker consent is implicit when they attack  
   *Cons:* Legal liability unclear; GDPR applies to all data collected, even from attackers

2. **Remove offensive features, keep defensive only** — remove zipbomb, sql-backfire, log-poisoning; keep honeypots, attacker profiling (read-only), canary documents  
   *Pros:* Much lower legal risk  
   *Cons:* Loses some of the most creative features

3. **Legal review then decide** — consult with a cybersecurity lawyer before any changes  
   *Pros:* Informed decision  
   *Cons:* Delays resolution

### Decision

**Obtain a legal review (option 3) before any further deployment changes.**

In the meantime, the features remain in place (they are already deployed). No new offensive features should be added without legal sign-off.

Canary documents and honeytokens (read-only tracking) are lower-risk and may continue.

### Consequences

- Easier: Reduced legal exposure if review recommends removing active countermeasures
- Harder: Legal review takes time and money; may require significant code removal

---

## ADR-005: Dependency Consolidation (Icon Libraries)

**Status:** Proposed  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

Three separate icon libraries are in use:
- `@heroicons/react` (~60 KB gzipped)
- `@phosphor-icons/react` (~140 KB gzipped, the largest)
- `lucide-react` (~50 KB gzipped)

This adds ~250 KB of icon library code to the bundle and creates visual inconsistency.

### Options Considered

1. **Standardise on Phosphor** — already the most widely used in the codebase  
   *Pros:* No icon migration needed for most files; largest library (16 000+ icons)  
   *Cons:* Largest bundle size; must remove heroicons and lucide

2. **Standardise on Lucide** — most popular in the React/shadcn/ui ecosystem  
   *Pros:* Perfect match with shadcn/ui which also uses lucide-react  
   *Cons:* Must migrate Phosphor and heroicons usages

3. **Standardise on Heroicons** — from the Tailwind CSS team  
   *Pros:* Well-maintained  
   *Cons:* Fewest icons; most migration work

### Decision

**Standardise on Lucide React** because the project uses shadcn/ui which already depends on `lucide-react`. This eliminates one redundant dependency.

Migrate Heroicons usages first (fewer instances), then plan Phosphor migration in a separate sprint.

### Consequences

- Easier: One icon vocabulary; consistent visual weight; smaller bundle
- Harder: Icon migration PRs needed; must find Lucide equivalents for Phosphor-specific icons

---

## ADR-006: Testing Strategy

**Status:** Proposed  
**Date:** 2026-04-01  
**Author:** copilot/deep-audit-dokumentation  

### Context

Current test coverage is near-zero for components and APIs. There are:
- 1 component test (`SpotifyEmbed.test.tsx`)
- 1 hook test (`use-local-storage.test.ts`)
- 6 lib unit tests

No E2E tests, no visual regression tests, no API tests.

### Options Considered

1. **Unit tests only (Vitest)** — test all components and utilities  
   *Pros:* Fast; already set up  
   *Cons:* Does not catch integration or rendering bugs

2. **E2E tests only (Playwright)** — test real user flows end-to-end  
   *Pros:* High confidence; catches real regressions  
   *Cons:* Slow; requires running server; harder to maintain

3. **Layered strategy** — Unit (Vitest) + Integration (React Testing Library) + E2E (Playwright)  
   *Pros:* Balanced; each layer catches different bugs  
   *Cons:* More setup; more maintenance

### Decision

**Adopt a layered testing strategy:**

| Layer | Tool | Target Coverage |
|-------|------|-----------------|
| Unit | Vitest | All `src/lib/` utilities — 80%+ |
| Component | Vitest + @testing-library/react | All critical components — 60%+ |
| E2E | Playwright | 5 critical user flows |
| Visual | Playwright | Key breakpoints (mobile, tablet, desktop) |

**Priority order for new tests:**
1. Admin login flow (E2E)
2. Contact form submission (E2E)
3. Newsletter subscription (E2E)
4. `src/lib/` utilities (unit)
5. Navigation and Hero components (component)

### Consequences

- Easier: Regressions caught before deploy; refactoring safer
- Harder: CI time increases; tests must be maintained alongside code

---

*New ADRs should be added at the bottom of this file with sequential IDs (ADR-007, ADR-008, etc.).*
