# Admin Patterns

## Two admin layers

| Layer | Storage | UI |
|-------|---------|-----|
| **Next.js admin** (primary) | Supabase tables + `site_config` | `app/admin/**` |
| Legacy AdminPanel / CMS | KV `admin:settings`, `zd-cms:*` | `AdminPanel.tsx`, `cms/AdminShell.tsx` |

New public-facing config → **Supabase `site_config`**, not KV.

## Site config mutations

`updateSiteConfig` in `app/admin/_actions/siteConfig.ts` dispatches `update_site_config` via `lib/admin-action-registry.ts`.

Revalidate paths include `/`, `/legal-notice`, `/privacy-policy` after saves.

## AdminActionRegistry (legacy panel)

Mutations to `AdminSettings` / `SiteData` from legacy panel go through `dispatchAdminAction`. Register new actions with Zod schemas + tests in `src/test/admin-action-registry.test.ts`.

Common IDs: `update_admin_value`, `update_site_config`, `set_section_visibility`, …

## Legal editor

`/admin/legal` — `LegalConfigEditor.tsx`. Draft preview: `broadcastAdminDraft('legal', ...)`.

Footer URL fields: Site Config → Footer & Legal tab.

## Undo / analytics (legacy)

`AdminPanel.tsx`: undo stack (max 50). Analytics gated by `adminSettings.analytics.*` + cookie consent.