# Components layout

Shared UI for the public site and overlays. Admin UI lives under `app/admin/_components/`.

| Directory / file | Purpose |
|------------------|---------|
| `ui/` | shadcn/Radix primitives (buttons, dialogs, forms, …) |
| `overlays/` | Cyberpunk overlay panel content (release, gig, member, contact) |
| `releases/` | Release cards, carousels, tracklist, streaming links |
| `theme-customizer/` | Legacy theme tabs (fonts, presets, visibility) — used by admin appearance |
| Root `*.tsx` | Site chrome: effects, embeds, loaders, `CyberpunkOverlay`, `CookieConsent`, `SectionErrorBoundary` |

Public page sections are in `app/_components/public/`, not here.