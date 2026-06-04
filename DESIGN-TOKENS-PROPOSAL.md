# Design Tokens Proposal

This document records the full design token proposal derived from the audit in `AUDIT-REPORT.md`.
The tokens listed here have been implemented in `src/lib/design-tokens.ts` and `src/index.css`.

---

## Spacing Scale

| Token | CSS var | Desktop | Mobile | Tailwind utility |
|-------|---------|---------|--------|-----------------|
| Section padding | `--spacing-section` | 6 rem | 4 rem | `py-section` |
| Card padding | `--spacing-card` | 1.5 rem | 1 rem | `p-card` |
| Inline gap | `--spacing-inline` | 1 rem | 1 rem | `gap-inline` |

### Design Presets (spacing)

| Preset | `--spacing-section` | `--spacing-card` |
|--------|---------------------|-----------------|
| `compact` | 4 rem | 1 rem |
| `standard` | 6 rem | 1.5 rem |
| `spacious` | 8 rem | 2 rem |

---

## Typography Scale

| Token | CSS var | Value | Tailwind utility |
|-------|---------|-------|-----------------|
| Hero headline | `--font-size-hero` | `clamp(2rem, 5vw, 4rem)` | `text-hero` |
| Section heading | `--font-size-heading` | `clamp(1.5rem, 3vw, 2.5rem)` | `text-heading` |
| Body copy | `--font-size-body` | `1rem` | `text-body` |
| Small / caption | `--font-size-small` | `0.875rem` | `text-body-sm` |

### Typography Presets

| Preset | hero | heading | body | small |
|--------|------|---------|------|-------|
| `compact` | `clamp(1.5rem, 4vw, 3rem)` | `clamp(1.2rem, 2.5vw, 2rem)` | `0.875rem` | `0.75rem` |
| `standard` | `clamp(2rem, 5vw, 4rem)` | `clamp(1.5rem, 3vw, 2.5rem)` | `1rem` | `0.875rem` |
| `expressive` | `clamp(2.5rem, 6vw, 5rem)` | `clamp(1.8rem, 3.5vw, 3rem)` | `1.125rem` | `1rem` |

---

## Semantic Color Tokens

| Token | CSS var | Resolves to | Tailwind utility |
|-------|---------|-------------|-----------------|
| Brand primary | `--color-brand-primary` | `var(--color-accent-9)` | `text-brand-primary`, `bg-brand-primary` |
| Brand secondary | `--color-brand-secondary` | `var(--color-accent-secondary-9)` | `text-brand-secondary` |
| Surface base | `--color-surface-base` | `var(--color-neutral-1)` | `bg-surface-base` |
| Surface elevated | `--color-surface-elevated` | `var(--color-neutral-2)` | `bg-surface-elevated` |

---

## Border Radius Tokens

| Token | CSS var | Value | Use case |
|-------|---------|-------|---------|
| Card radius | `--radius-card` | `0.5rem` | Cards, panels |
| Button radius | `--radius-button` | `0.25rem` | Buttons |
| Input radius | `--radius-input` | `0.375rem` | Form inputs |

---

## Implementation files

| File | Purpose |
|------|---------|
| `src/index.css` `:root` block | CSS custom properties (source of truth at runtime) |
| `src/lib/design-tokens.ts` | TypeScript constants (used at build time / in admin panel) |
| `tailwind.config.js` | Semantic utility classes (consumed in component `className` strings) |

---

## Admin Panel Integration

The `DESIGN_PRESETS` export in `src/lib/design-tokens.ts` exposes `compact`, `standard`, and `spacious`
presets. A future admin panel field can use these to give users a single "Spacing Preset" select:

```typescript
import { DESIGN_PRESETS } from '@/lib/design-tokens'

// Example registry field (future)
{
  path: 'design.layout.spacingPreset',
  type: 'select',
  label: 'Spacing Preset',
  options: Object.keys(DESIGN_PRESETS.spacing).map(key => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  })),
  disclosure: 'basic',
}
```

---

## Migration path for existing components

All existing components that use hardcoded spacing (e.g. `py-24 px-4`) continue to work
unchanged because the values are numerically equivalent. Migration is incremental:

1. Use `<SectionBase>` — the wrapper already uses the correct structural classes.
2. Swap inner content from `py-20 px-4` → `py-section px-card` when touching a file.
3. Swap typography from `text-4xl` → `text-heading` etc.

See `MIGRATION-GUIDE.md` for step-by-step instructions.
