# Zardonic Industrial — Agent Guidelines

Zardonic artist website: public site + admin CMS.

**Stack:** Next.js App Router, React, Supabase (PostgreSQL), Cloudflare R2, Vercel, TypeScript, Tailwind 4, Framer Motion, Lenis.

**Package manager:** npm only (`npm ci` in CI).

---

## Session start (read before coding)

1. **This file** — critical rules, checks, and docs closeout.
2. **Topic file** — open the matching `docs/agent/{topic}.md` from the table below for the area you touch.
3. **[docs/DEVELOPMENT_STATUS.md](./docs/DEVELOPMENT_STATUS.md)** — only when the task is product/phase-shaped (not pure refactors/CI).
4. **End of session** — docs refresh is mandatory; follow [docs/agent/workflow.md](./docs/agent/workflow.md).

Skipping specs and fixing production later costs more than reading first.

---

## Mandatory checks (every code change)

Prefer the full local pipeline (same surface as GitHub CI):

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

No PR with failing checks. No `as any`, `@ts-ignore`, or `eslint-disable` to silence errors (except documented, pre-existing suppressions).

**Definition of done is production, not a green PR:**

1. CI green on the PR.
2. Merge to `main`.
3. Confirm Vercel **Production** deploy for the merge commit SHA.
4. Tell the user to hard-refresh (Ctrl+Shift+R) when visual bugs were fixed.

A green PR that is still open is **not** shipped. Do not claim “fixed” until `main` + Production match the fix.

---

## Mandatory docs update (end of every agent session)

**Always** refresh documentation before you declare work done, open a PR, or hand off — not only when the user asks. Treat docs as part of the deliverable, same as code.

1. Update every **stale** markdown that describes what you changed (agent specs, product docs, living docs).
2. Run the full end-of-session review in [docs/agent/workflow.md](./docs/agent/workflow.md).
3. When product behaviour changed: [CHANGELOG.md](./CHANGELOG.md), [QA_CHECKLIST.md](./QA_CHECKLIST.md); when a reusable lesson appeared: [docs/LESSONS_LEARNED.md](./docs/LESSONS_LEARNED.md).
4. New/changed patterns → matching `docs/agent/*.md`. Public surface / ops → `README.md`, `docs/ADMIN_GUIDE.md`, `SECURITY.md` as applicable.

Skipping docs because “the task was only code” is a process failure.

---

## Critical rules (always apply)

- **Minimal diffs** — smallest change that fully solves the task; no drive-by refactors
- **Strict TypeScript** — no `any` in production code
- **PageLayout** on every public page; z-index via `var(--z-*)` only ([architecture](./docs/agent/architecture.md))
- **Two-click embeds** — Spotify/YouTube never auto-load ([security](./docs/agent/security.md))
- **Legal data** — Supabase `site_config.legal` only; pages `/legal-notice`, `/privacy-policy`; admin `/admin/legal`
- **Consent** — import from `@/lib/consent`, not UI components, in non-UI code
- **Overlays** — gallery / release / gig detail use **`CyberpunkOverlay`** only ([public-ui](./docs/agent/public-ui.md))
- **Partner logos** — white mode via canvas pipeline (`lib/partner-logo-white.ts`); **never** CSS `brightness(0) invert(1)` on remote PNGs ([public-ui](./docs/agent/public-ui.md))
- **Nav labels** — compact defaults in `lib/nav-links.ts` (`Bio`, `Releases`, …); full titles stay on section headings
- **Nav logo** — flex flow `shrink-0`, never `position: absolute` over the link row
- **Docs** — always update markdown at session end (see above)

---

## Public UI — decision trees (read before touching chrome)

### Navigation / logo

1. Logo is a **flex sibling** of the nav (`shrink-0`), not absolutely positioned over links.
2. Nav link text comes from `resolveNavLabel` / `NAV_DEFAULT_LABELS` — **short** labels only.
3. Section page headings may stay long (`Biography`, `Discography`) via section config — do **not** put those strings in the top nav.
4. After any nav change: desktop screenshot or layout check that the first label (usually **BIO**) is fully visible beside the logo.

### Modals / lightboxes

1. **Release, gig, gallery, contact, member** → open `CyberpunkOverlay` with the correct `CyberpunkOverlayState` type.
2. Do **not** invent a second modal shell (custom fixed panels, one-off lightboxes).
3. Overlay open → lock body + **Lenis** (`lenis.stop()` / `start()`), same as `CyberpunkOverlay`.
4. Gallery content lives in `components/overlays/GalleryOverlayContent.tsx` **inside** the shared shell.

### Partner / credit logos (PNG alpha)

1. White logos: `PartnerLogoWhite` → `loadLogoImageForCanvas` + `processLogoToWhiteSilhouette`.
2. **Forbidden:** CSS `mask-image` on cross-origin R2 URLs (CORS → solid white box).
3. **Forbidden:** `filter: brightness(0) invert(1)` on logos that may have a baked white background (→ solid white box, e.g. QUESTEC).
4. Fallback if canvas fails: show original **without** invert — never invent a white plate.

### Footer

1. Social icons ≥ `h-7` / `sm:h-8`; legal links ≥ `text-sm` / `sm:text-base`.
2. Always `flex-wrap` + `min-h-[44px]` touch targets.

Full detail: [docs/agent/public-ui.md](./docs/agent/public-ui.md).

---

## Detailed guidelines

Read the relevant file **before** working in that area:

| Topic | File |
|-------|------|
| CI loop, docs maintenance, multi-agent, PR closeout | [workflow.md](./docs/agent/workflow.md) |
| Layers, PageLayout, site_config, IoC, legal routes | [architecture.md](./docs/agent/architecture.md) |
| GDPR, cookies, admin auth, legal fields | [security.md](./docs/agent/security.md) |
| Admin / Supabase mutations, registries | [admin.md](./docs/agent/admin.md) |
| Typography, a11y, mobile (generic) | [ui.md](./docs/agent/ui.md) |
| Public chrome hazards (nav, overlay, logos, footer) | [public-ui.md](./docs/agent/public-ui.md) |
| Session gate checklist + known stable fixes | [session-checklist.md](./docs/agent/session-checklist.md) |

After introducing new patterns, update the relevant `docs/agent/*.md` file.

**Before finishing any session or opening a PR:** complete the mandatory docs update above and the end-of-session review in [workflow.md](./docs/agent/workflow.md).

---

## Human / external docs

- [Architecture](./docs/ARCHITECTURE.md) · [Admin guide](./docs/ADMIN_GUIDE.md) · [GDPR](./docs/GDPR_COMPLIANCE.md)
- [Development status](./docs/DEVELOPMENT_STATUS.md) · [Tech debt](./docs/TECH_DEBT_TRACKER.md)
- [Agent workflow (human)](./docs/CODING_AGENT_WORKFLOW.md) · [Changelog](./CHANGELOG.md)
- [Lessons learned](./docs/LESSONS_LEARNED.md) · [QA checklist](./QA_CHECKLIST.md) · [Security](./SECURITY.md)

When conventions change, update the relevant `docs/agent/*.md` file and [CHANGELOG.md](./CHANGELOG.md) — keep this root file as the **session control plane**, not a dump of every rule.
