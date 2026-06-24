# Agent Session Checklist

## Before closing a PR / task

```
[ ] npm run lint        → 0 errors, 0 warnings
[ ] npm run typecheck   → 0 errors
[ ] npm run build       → 0 errors, 0 warnings
[ ] npm run test        → all tests pass (or document pre-existing failures)
[ ] CHANGELOG.md        → [Unreleased] entry
[ ] docs/LESSONS_LEARNED.md → row for non-trivial lessons
[ ] docs/agent/*.md or README → if conventions changed
```

## During development

- Minimal diffs — no unrelated refactors
- Tests alongside new utilities/registries
- No new deps without `npm audit` check
- Update `docs/agent/` when introducing conventions (not a bloated root AGENTS.md)

## Known stable fixes

| Area | Files | Rule |
|------|-------|------|
| Supabase admin auth | `app/admin/login/submit/route.ts`, `proxy.ts`, `lib/supabaseServer.ts` | Native POST login; pass cookie `options` unchanged; forward SSR cache headers; copy cookies on all proxy redirects |
| Redis short-circuit | `api/auth.ts:validateSession` | Return false if `!isRedisConfigured()` |
| WebGL cleanup | `ModelBackground.tsx` | Dispose geometry/material/texture before renderer |
| Upload unmount | `useVideoUpload.ts`, `useMediaUpload.ts` | `isMountedRef` guard |
| Vitest localStorage | `src/test/setup.ts` | Full Storage mock — Node 22+ partial `localStorage` breaks `clear()` / `setItem()` |
| Odesli dual API | `lib/odesli.ts` | Server: `fetchOdesliLinksFromApi`; client editor: `fetchOdesliLinks` via `/api/odesli` queue |

Full historical notes remain in git history and [LESSONS_LEARNED.md](../LESSONS_LEARNED.md).