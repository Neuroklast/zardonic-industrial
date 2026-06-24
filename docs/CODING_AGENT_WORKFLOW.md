# Coding Agent Workflow

> **Last Updated:** 2026-06-24

Mandatory workflow for AI agents and contributors. Detailed conventions live in **[AGENTS.md](../AGENTS.md)** and **[docs/agent/](./agent/)** — read those instead of duplicating rules here.

## Quick flow

```
PLAN → DEVELOP → TEST → VALIDATE → DOCUMENT
```

## Phase 1 — Plan

1. Read [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) for current phase and blockers
2. Read relevant [docs/agent/](./agent/) guide for the task area
3. Explore code; publish a short file-level plan

## Phase 2 — Develop

- Match existing patterns; strict TypeScript
- Public site data → Supabase `site_config` / content tables
- Legal text → `site_config.legal` + `lib/legal-templates.ts`

## Phase 3 — Test

```bash
npm run test
```

Mock external APIs. Add tests for new `lib/` utilities and registries.

## Phase 4 — Validate

```bash
npm run lint && npm run typecheck && npm run build
```

## Phase 5 — Document

Complete [session-checklist.md](./agent/session-checklist.md):

- `CHANGELOG.md` [Unreleased]
- `docs/LESSONS_LEARNED.md` for non-trivial lessons
- `docs/agent/*.md` if conventions changed
- `README.md` / `ADMIN_GUIDE.md` for user-facing changes

## Where to look

| Task | Start here |
|------|------------|
| Layers / PageLayout | [agent/architecture.md](./agent/architecture.md) |
| GDPR / cookies / legal | [agent/security.md](./agent/security.md) |
| Admin / site_config | [agent/admin.md](./agent/admin.md) |
| UI / a11y | [agent/ui.md](./agent/ui.md) |
| Session gate | [agent/session-checklist.md](./agent/session-checklist.md) |