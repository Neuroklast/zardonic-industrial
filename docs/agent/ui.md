# UI, Typography & Accessibility

## WCAG 2.1 AA

- Minimum `12px` (`text-xs`) for continuous reading text
- `aria-label` on icon-only controls
- Keyboard focus on custom interactive elements
- Sufficient contrast (`oklch` design tokens)

## Typography

CSS vars: `--font-heading`, `--font-body`, `--font-mono` — set in `use-app-theme.ts` from admin theme.

Admin UI shield: any admin container needs `data-admin-ui="true"` so theme fonts do not leak into CMS shell.

## Release gallery layouts

`grid` (default), `swipe` (Embla), `carousel-3d` (`useTouchSwipe`).

## Mobile

Legal pages and footer: `flex-wrap`, `min-h-[44px]` touch targets, `break-words` on long URLs.

Admin legal editor: sticky save bar on narrow viewports.