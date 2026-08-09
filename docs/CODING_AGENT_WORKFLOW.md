# Coding Agent Workflow

> **Last Updated:** 2026-08-09

Mandatory workflow for AI agents and contributors.  
**Session control plane:** root [AGENTS.md](../AGENTS.md) + [docs/agent/](./agent/).  
Do not duplicate long rules here — link and enforce.

## Quick flow

```
PLAN → DEVELOP → TEST → VALIDATE → DOCUMENT → SHIP (merge + Production)
```

Detail: [agent/workflow.md](./agent/workflow.md).

## Phase 1 — Plan

1. Read [AGENTS.md](../AGENTS.md) critical rules + decision trees
2. Open the matching [docs/agent/](./agent/) topic file
3. For product phase context: [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)
4. Explore code; short file-level plan for non-trivial work

## Phase 2 — Develop

- Match existing patterns; strict TypeScript
- Public site data → Supabase `site_config` / content tables
- Legal text → `site_config.legal` + `lib/legal-templates.ts`
- Public chrome → [agent/public-ui.md](./agent/public-ui.md)

## Phase 3 — Test

```bash
npm run test
```

Mock external APIs. Add tests for new `lib/` utilities and public UI regression guards.

## Phase 4 — Validate

```bash
npm run lint && npm run typecheck && npm run build
```

## Phase 5 — Document

Complete [agent/session-checklist.md](./agent/session-checklist.md) and living docs:

- `CHANGELOG.md` [Unreleased]
- `docs/LESSONS_LEARNED.md` for non-trivial lessons
- `docs/agent/*.md` if conventions changed
- `QA_CHECKLIST.md` if user flows changed

## Phase 6 — Ship

1. PR with green CI  
2. Merge to `main`  
3. Confirm Vercel Production SHA  
4. Hard-refresh instructions for visual fixes  

**A green open PR is not shipped.**

## Where to look

| Task | Start here |
|------|------------|
| Session / CI / docs | [agent/workflow.md](./agent/workflow.md) |
| Layers / PageLayout | [agent/architecture.md](./agent/architecture.md) |
| GDPR / cookies / legal | [agent/security.md](./agent/security.md) |
| Admin / site_config | [agent/admin.md](./agent/admin.md) |
| UI / a11y | [agent/ui.md](./agent/ui.md) |
| Nav / overlay / logos | [agent/public-ui.md](./agent/public-ui.md) |
| Session gate | [agent/session-checklist.md](./agent/session-checklist.md) |
