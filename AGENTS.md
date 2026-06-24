# Agent Guidelines

Zardonic artist website — **Next.js App Router**, **Supabase**, TypeScript, Tailwind 4.

## Session gate

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

## Universal rules

- **Minimal diffs** — solve the task only; no drive-by refactors
- **Strict TypeScript** — no `any`
- **PageLayout** on every public page; z-index via `var(--z-*)` only ([architecture](./docs/agent/architecture.md))
- **Two-click embeds** — Spotify/YouTube never auto-load ([security](./docs/agent/security.md))
- **Legal data** — Supabase `site_config.legal` only; pages `/legal-notice`, `/privacy-policy`; admin `/admin/legal`
- **Consent** — import from `@/lib/consent`, not UI components, in non-UI code

## Detailed agent docs

| Topic | File |
|-------|------|
| Layers, site_config, IoC | [docs/agent/architecture.md](./docs/agent/architecture.md) |
| GDPR, auth, legal fields | [docs/agent/security.md](./docs/agent/security.md) |
| Admin / Supabase mutations | [docs/agent/admin.md](./docs/agent/admin.md) |
| UI, a11y, typography | [docs/agent/ui.md](./docs/agent/ui.md) |
| Session checklist & known fixes | [docs/agent/session-checklist.md](./docs/agent/session-checklist.md) |

## Human documentation

- [Architecture](./docs/ARCHITECTURE.md) · [Admin guide](./docs/ADMIN_GUIDE.md) · [GDPR](./docs/GDPR_COMPLIANCE.md)
- [Development status](./docs/DEVELOPMENT_STATUS.md) · [Tech debt](./docs/TECH_DEBT_TRACKER.md)
- [Agent workflow](./docs/CODING_AGENT_WORKFLOW.md) · [Changelog](./CHANGELOG.md)

When conventions change, update the relevant `docs/agent/*.md` file and [CHANGELOG.md](./CHANGELOG.md) — keep this root file short.