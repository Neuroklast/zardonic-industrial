# Coding Agent Workflow — Zardonic Industrial

> **Last Updated:** 2026-04-01  
> **Agent ID:** copilot/deep-audit-dokumentation  

---

## Overview

This document defines the **mandatory workflow** for every coding agent working on the `Neuroklast/zardonic-industrial` repository. Following this workflow ensures consistent, safe, well-documented changes that integrate cleanly with the existing codebase.

> ⚠️ **All agents must follow this workflow. No exceptions.**

---

## The 5-Phase Workflow

```
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1: PLAN   →  PHASE 2: DEVELOP  →  PHASE 3: TEST       │
│                                              │                │
│                                          FAIL? ──→ PHASE 1   │
│                                              │                │
│                                         PASS? ──→ PHASE 4    │
│                                                               │
│  PHASE 4: VALIDATE  →  PHASE 5: DOCUMENT                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Plan

**Before writing a single line of code:**

1. **Read `docs/DEVELOPMENT_STATUS.md`**
   - Check current sprint / phase
   - Review the feature checklists
   - Note any open blockers or known issues
   - Read the Agent Sync Section for recent activity

2. **Check open Issues and PRs on GitHub**
   - Are there open PRs that overlap with your task?
   - Does any open PR need to be merged or closed first?
   - Are there related Dependabot PRs that should be merged first?

3. **Explore the relevant code**
   - Read the files you will be changing
   - Understand existing patterns, conventions, and dependencies
   - Identify risk areas (tests, other components that depend on your change)

4. **Create a written plan**
   - Outline the specific files you will create/modify
   - List the test scenarios you will validate
   - Estimate impact on existing functionality
   - Use `report_progress` to publish the plan as a checklist

### ✅ Phase 1 Checklist

```markdown
- [ ] Read DEVELOPMENT_STATUS.md
- [ ] Checked open PRs for conflicts
- [ ] Explored relevant source files
- [ ] Published plan checklist via report_progress
```

---

## Phase 2: Develop

**Write the code:**

1. **Follow existing conventions**
   - Match the code style of the surrounding code
   - Use TypeScript strictly (types, no `any` without justification)
   - Follow component patterns established in `src/components/`
   - Use existing utilities in `src/lib/` before writing new ones

2. **Make surgical, minimal changes**
   - Change only what is required to fulfil the task
   - Do not refactor unrelated code
   - Do not introduce new dependencies without security check (`gh-advisory-database`)

3. **Keep commits atomic**
   - One logical change per commit
   - Write descriptive commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)

4. **Document as you go**
   - Add JSDoc comments to new public functions
   - Update inline comments for non-obvious logic
   - If you make an architectural decision, note it in `docs/ARCHITECTURE_DECISION_RECORDS.md`

### ✅ Phase 2 Checklist

```markdown
- [ ] Follows existing code conventions
- [ ] TypeScript types in place (no untyped `any`)
- [ ] No unrelated refactoring
- [ ] New dependencies security-checked
- [ ] Commits are atomic and descriptively named
```

---

## Phase 3: Test

**Validate your changes work:**

1. **Run existing tests first (baseline)**
   ```bash
   npm run test
   ```
   Ensure nothing was broken before your changes.

2. **Run the linter**
   ```bash
   npm run lint
   ```
   Fix any errors introduced by your changes.

3. **Run the build**
   ```bash
   npm run build
   ```
   Ensure the production build still compiles.

4. **Write targeted tests**
   - Add unit tests for new utility functions (`src/lib/`)
   - Add component tests for new UI components (`src/test/` or co-located `.test.tsx`)
   - Minimum: one happy-path test per new function/component

5. **Manual verification**
   - Run `npm run dev` and visually verify your changes
   - Test on mobile viewport (Chrome DevTools)
   - Test keyboard navigation if touching interactive elements

### ✅ Phase 3 Checklist

```markdown
- [ ] `npm run test` passes (no new failures)
- [ ] `npm run lint` passes (no new errors)
- [ ] `npm run build` passes
- [ ] New tests written for new code
- [ ] Manual verification completed
```

---

## Phase 4: Validate

**If Phase 3 tests pass → proceed to Phase 5.**

**If Phase 3 tests fail:**

1. **Stop. Do not push broken code.**
2. **Return to Phase 1** — re-read the relevant code
3. **Update your plan** — identify what your initial understanding was wrong about
4. **Document the failure** in your session notes (will go into `docs/LESSONS_LEARNED.md` in Phase 5)
5. **Repeat Phases 1–3** with the revised plan

> ⚠️ **Never push forward with a broken plan. Fix the plan first.**

### ✅ Phase 4 Checklist

```markdown
- [ ] All Phase 3 checks passed
- [ ] No regressions in existing tests
- [ ] If any test failed: plan was revised before re-attempting
```

---

## Phase 5: Document

**After all tests pass:**

1. **Update `docs/DEVELOPMENT_STATUS.md`**
   - Check off completed items in the feature checklists
   - Add your session to the **Agent Sync Section** table:
     ```
     | DATE | AGENT_ID | SESSION_SUMMARY | FILES_CHANGED | STATUS |
     ```
   - Update "Current Sprint / Phase" if appropriate

2. **Add lessons learned to `docs/LESSONS_LEARNED.md`**
   - Record anything non-obvious you discovered
   - Record any mistakes made and how they were caught
   - Use the table format defined in that document

3. **If you made an architectural decision, add an ADR**
   - See template in `docs/ARCHITECTURE_DECISION_RECORDS.md`

4. **If you found or fixed technical debt, update `docs/TECH_DEBT_TRACKER.md`**
   - Mark resolved items as `✅ Resolved`
   - Add new items with full metadata

5. **If you found or fixed a security issue, update `docs/SECURITY_FINDINGS.md`**
   - Mark resolved findings as fixed
   - Add new findings with CVSS-style scoring

6. **Use `report_progress` to commit and push all changes**

### ✅ Phase 5 Checklist

```markdown
- [ ] DEVELOPMENT_STATUS.md updated (checklist + Agent Sync Section)
- [ ] LESSONS_LEARNED.md entry added
- [ ] ADR added (if applicable)
- [ ] TECH_DEBT_TRACKER.md updated (if applicable)
- [ ] SECURITY_FINDINGS.md updated (if applicable)
- [ ] All changes committed and pushed via report_progress
```

---

## Quick Reference

### Key Files to Read Before Starting

| File | Why |
|------|-----|
| `docs/DEVELOPMENT_STATUS.md` | Current state, open items, recent agent activity |
| `docs/DEEP_AUDIT.md` | All known issues with severity ratings |
| `docs/TECH_DEBT_TRACKER.md` | Prioritised technical debt register |
| `docs/SECURITY_FINDINGS.md` | Security issues and their remediation status |
| `docs/ARCHITECTURE_DECISION_RECORDS.md` | Why things are built the way they are |
| `README.md` | Project overview and environment setup |

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 |
| Animation | Framer Motion + Three.js |
| UI Primitives | Radix UI + shadcn/ui |
| State | React `useState`/`useReducer` (Zustand planned) |
| Routing | None (React Router planned) |
| Backend | Vercel Serverless Functions (TypeScript) |
| Database | Upstash Redis (via `@upstash/redis`, `@vercel/kv`) |
| Email | Resend |
| Deployment | Vercel |
| Testing | Vitest + @testing-library/react |
| Linting | ESLint 9 + typescript-eslint |

### Commands

```bash
npm run dev         # Start dev server
npm run build       # Production build (note: --noCheck in use)
npm run test        # Run all tests
npm run lint        # Run ESLint
npm run preview     # Preview production build locally
```

### Environment Variables Required

```
UPSTASH_REDIS_REST_URL      # Upstash Redis HTTP URL
UPSTASH_REDIS_REST_TOKEN    # Upstash Redis auth token
KV_REST_API_URL             # Vercel KV URL
KV_REST_API_TOKEN           # Vercel KV token
BANDSINTOWN_API_KEY         # Bandsintown artist API key
RATE_LIMIT_SALT             # Random secret for IP hashing (required in production)
ALLOWED_ORIGIN              # Allowed CORS origin for image proxy
RESEND_API_KEY              # Resend email API key
ADMIN_EMAIL                 # Admin email for contact notifications
```

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Add more logic to `App.tsx` | Create a new component or context |
| Use `any` in TypeScript | Define proper types or use `unknown` |
| Skip tests because "it's small" | Write at least one test |
| Push without running lint/build | Always run `npm run lint && npm run build` |
| Modify unrelated files | Keep changes surgical |
| Skip Phase 5 docs update | Always update DEVELOPMENT_STATUS.md |
| Create new dependencies without security check | Run `gh-advisory-database` first |
| Mix multiple features in one commit | One logical change per commit |

---

*Agents that do not follow this workflow risk introducing regressions, security issues, or undocumented technical debt.*
