# Agent Workflow

Rules for AI agent runs on this project. Session start + mandatory CI live in root [`AGENTS.md`](../../AGENTS.md). Never open a PR with failing checks; no `as any` / `@ts-ignore` / bare `eslint-disable` to silence errors.

---

## Local CI

Same gate surface as `.github/workflows/ci.yml` (approx.):

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

Prefer the full chain before every PR. Re-run a single command when debugging a failure.

---

## Pull requests

1. Branch from up-to-date `main`.
2. Smallest commits that each leave the tree green when practical.
3. PR description: what / why / how to verify (include visual checks for public UI).
4. **Merge only when CI is green.**
5. After merge: confirm Vercel **Production** deploy SHA matches the merge commit.
6. If the user reported visual bugs: require hard-refresh and list what to re-check.

A fix sitting on an open PR while the user stares at production is a **process failure**.

---

## Docs review (end of every session) — always required

Agents **must always** update documentation and relevant markdown at the end of the session (or before every PR), as part of the same deliverable as code. Do not wait for the user to ask. “Code-only” handoffs that leave docs stale are incomplete.

**When:** After the feature/fix is implemented and checks pass; **before** you say the task is done, open a PR, or stop.

**What to do:**

1. Re-read what changed (diff / summary).
2. Update **every** markdown that would otherwise lie or omit the new behaviour (table below).
3. Prefer small, accurate edits over large rewrites; do not invent product claims.
4. If nothing product-facing changed, still confirm living docs / agent specs need no touch — and note that briefly.

| Area | Files |
|------|-------|
| Agent spec | `AGENTS.md`, `docs/agent/*.md` |
| Onboarding | `README.md`, `docs/ADMIN_GUIDE.md`, `.env.example` if present |
| Product / legal / security | `docs/GDPR_COMPLIANCE.md`, `SECURITY.md`, `docs/ARCHITECTURE.md` |
| Living docs | `CHANGELOG.md`, `docs/LESSONS_LEARNED.md`, `QA_CHECKLIST.md` |

### Living docs (before every PR)

| File | When to update |
|------|----------------|
| `CHANGELOG.md` | User-facing features, public UI fixes, API/route changes, security fixes — bullets under `[Unreleased]`. Skip pure internal refactors with no observable change. |
| `docs/LESSONS_LEARNED.md` | Recurring anti-pattern, non-obvious failure mode, or process gap — append a dated row. Promote to `AGENTS.md` / topic files only after the pattern is stable. |
| `QA_CHECKLIST.md` | New/changed user flows, overlays, consent, nav, logo rendering — add or adjust checklist items. |

**Minimal changes:** smallest diff that fully solves the requirement; no unrelated refactors; no new dependencies unless necessary.

---

## Session phases

```
PLAN → DEVELOP → TEST → VALIDATE → DOCUMENT → SHIP
```

| Phase | Actions |
|-------|---------|
| **Plan** | Read `AGENTS.md` + topic file; explore code; short file-level plan for non-trivial work |
| **Develop** | Match existing patterns; respect decision trees (nav / overlay / logos) |
| **Test** | `npm run test`; add tests for new `lib/` utilities and regression guards for public UI |
| **Validate** | lint + typecheck + build |
| **Document** | Living docs + agent specs |
| **Ship** | PR → green CI → merge → Production SHA confirmed |

---

## Multi-agent pattern (large tasks)

For tasks with >3 distinct concerns:

1. List sub-tasks in the PR description.
2. One atomic commit per sub-task when practical.
3. Run full checks after each commit or before push.
4. Prefer separate PRs for independent modules; mark blocking deps explicitly.

---

## Visual / public UI sessions

When the user reports screenshot bugs:

1. Open the newest files under `screenshots/` (if present) **before** coding.
2. Map each bug to a decision tree in `AGENTS.md` / `public-ui.md`.
3. Fix root cause, not a parallel half-implementation (e.g. do not rebuild a second modal).
4. Ship through Production; ask for hard-refresh + which items to re-verify.

---

## Living spec

- New conventions → update the matching `docs/agent/*.md` file.
- New topic → add file and link from `AGENTS.md` + this workflow index in `docs/agent/README.md`.

**Session closeout (non-negotiable):**

```
code complete → mandatory checks → docs/markdown update → merge + Production confirm → only then report done
```
