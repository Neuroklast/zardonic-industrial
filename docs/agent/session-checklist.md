# Agent Session Checklist

## Before claiming “done” / opening a PR

```
[ ] Topic docs read (AGENTS.md + matching docs/agent/*.md)
[ ] npm run lint        → 0 errors (no new warnings if avoidable)
[ ] npm run typecheck   → 0 errors
[ ] npm run build       → 0 errors
[ ] npm run test        → all tests pass (or document pre-existing failures)
[ ] CHANGELOG.md        → [Unreleased] entry when user-visible
[ ] docs/LESSONS_LEARNED.md → row for non-trivial lessons
[ ] docs/agent/*.md / QA_CHECKLIST.md → if conventions or flows changed
[ ] Public UI decision trees respected (nav / overlay / logos / footer)
```

## Before claiming “fixed on production”

```
[ ] PR CI green
[ ] Merged to main
[ ] Vercel Production deployment SHA == merge commit
[ ] User told to hard-refresh for visual fixes
[ ] Explicit re-check list given (not “should be fine”)
```

## During development

- Minimal diffs — no unrelated refactors
- Tests alongside new utilities/registries and public UI regression guards
- No new deps without necessity + audit awareness
- Update `docs/agent/` when introducing conventions (do not dump everything into root `AGENTS.md`)

## Known stable fixes

| Area | Files | Rule |
|------|-------|------|
| Supabase admin auth | `app/admin/login/submit/route.ts`, `proxy.ts`, `lib/supabaseServer.ts` | Native POST login; pass cookie `options` unchanged; forward SSR cache headers; copy cookies on all proxy redirects |
| Redis short-circuit | `api/auth.ts` / session helpers | Return false if Redis not configured |
| WebGL cleanup | `ModelBackground.tsx` / circuit backgrounds | Dispose geometry/material/texture before renderer |
| Partner SVG/PNG | `lib/partner-logo-white.ts`, `CreditsSection.tsx`, `app/api/partner-logo/route.ts` | Rewrite SVG to 1024px before canvas; **all** R2 logos via `/api/partner-logo` (never wsrv for R2 — stale inner hosts 404); light plate only if a dark mark exists (PWM white wordmark); eager load; no `whileInView`+`opacity:0` |
| Background video | `BackgroundStack.tsx` | No canvas animation while scroll video is active; seek ≥ 1/24s |
| Vitest localStorage | `src/test/setup.ts` | Full Storage mock — Node 22+ partial `localStorage` breaks `clear()` / `setItem()` |
| Odesli dual API | `lib/odesli.ts` | Server: `fetchOdesliLinksFromApi`; client editor: `fetchOdesliLinks` via `/api/odesli` queue |
| Nav logo vs BIO | `SiteNav.tsx` | Flex `shrink-0` logo; never absolute over links |
| Compact nav labels | `lib/nav-links.ts` | Short nav labels; long titles only on section headings |
| Gallery modal | `GallerySection` + `CyberpunkOverlay` + `GalleryOverlayContent` | Same shell as releases/events |
| Partner PNG white box | `lib/partner-logo-white.ts`, `CreditsSection.tsx` | Canvas silhouette; no CSS invert on white plates |
| Overlay scroll lock | `CyberpunkOverlay.tsx` | Body + html overflow + Lenis stop/start |
| Hero wordmark size | `HeroSection.tsx`, `HeroConfigEditor.tsx` | Separate **desktop** + **mobile** width % (`logoWidthPercent` / `logoWidthPercentMobile`); never one shared % |
| Look & Feel preview device | `AdminPreviewPane.tsx` | Desktop / Mobile toggle constrains iframe (390px) so media queries fire |
| Bio section crash | `BioSection.tsx`, `lib/safe-string.ts`, `app/page.tsx` | Always coerce `bio.content` before `.trim()`; section errors stay in `SectionErrorBoundary` |
| Section error fallback | `SectionErrorBoundary.tsx`, `lib/i18n.ts` | i18n keys `section.errorRender` / `section.errorRetry`; do not hardcode English only |
| Public locale hydrate | `contexts/LocaleContext.tsx`, `lib/locale-detect.ts` | `useSyncExternalStore` hydrated flag: SSR/hydrate = `initialPublicLocale`; after that `detectLocaleSync`. Never read storage/navigator on first paint or React #418 text |

Full historical notes: [LESSONS_LEARNED.md](../LESSONS_LEARNED.md).
