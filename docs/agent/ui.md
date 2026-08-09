# UI, Typography & Accessibility

Generic a11y and type rules. **Public chrome hazards** (nav, overlays, partner PNGs, footer sizes) live in [public-ui.md](./public-ui.md) — read that before homepage work.

## WCAG 2.1 AA

- Continuous reading text should stay at least ~12–14px; chrome/footer must not use unreadable micro type
- `aria-label` on icon-only controls
- Keyboard focus on custom interactive elements
- Sufficient contrast (`oklch` design tokens)
- Touch targets: `min-h-[44px] min-w-[44px]` on public icon controls
- `useReducedMotion` for non-essential motion when practical

## Typography

CSS vars: `--font-heading`, `--font-body`, `--font-mono` — set from admin theme.

Admin UI shield: any admin container needs `data-admin-ui="true"` so theme fonts do not leak into CMS shell.

## Release gallery layouts

`grid` (default), `swipe` (Embla), `carousel-3d` (`useTouchSwipe`).  
Lightbox = `CyberpunkOverlay` gallery type — see [public-ui.md](./public-ui.md).

## Mobile

Legal pages and footer: `flex-wrap`, `min-h-[44px]` touch targets, `break-words` on long URLs.

Admin legal editor: sticky save bar on narrow viewports.