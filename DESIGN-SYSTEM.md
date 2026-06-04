# Design System

This document is the authoritative reference for design tokens, component patterns, and
styling conventions in `zardonic-industrial`. All new components **must** follow these
guidelines. When editing existing components, migrate opportunistically to the new system.

---

## Z-Index Layers

All z-index values are defined in `src/layers.css` and mirrored in `src/lib/layer-contract.ts`.
**Never** write a raw integer z-index in CSS or inline styles.

```css
/* ✅ Correct */
.my-overlay { z-index: var(--z-overlay); }

/* ❌ Wrong */
.my-overlay { z-index: 9999; }
```

| Token | Value | Use case |
|-------|-------|---------|
| `--z-base` | 0 | Background elements |
| `--z-above` | 1 | Elements above background |
| `--z-fx` | 2 | Visual effects (matrix rain, noise) |
| `--z-content` | 10 | Main page content |
| `--z-sticky` | 20 | Sticky headers / sidebars |
| `--z-overlay` | 30 | Modals, overlays, drawers |
| `--z-hud` | 40 | HUD elements (SystemMonitorHUD) |
| `--z-top` | 50 | Toast notifications, tooltips |
| `--z-pseudo-below` | -1 | Pseudo-elements inside `isolation: isolate` |
| `--z-pseudo-below-2` | -2 | Second pseudo-element layer (below -1) |

### Rule: always add `isolation: isolate` when using negative z-index

```css
/* ✅ Correct — negative z-index stays contained */
.my-component {
  isolation: isolate;
}
.my-component::before {
  z-index: var(--z-pseudo-below);
}
```

---

## Spacing Scale

| Tailwind class | CSS var | Desktop | Mobile |
|----------------|---------|---------|--------|
| `py-section` / `my-section` | `--spacing-section` | 6 rem | 4 rem |
| `p-card` / `px-card` | `--spacing-card` | 1.5 rem | 1 rem |
| `gap-inline` | `--spacing-inline` | 1 rem | 1 rem |

```tsx
// ✅ Correct — semantic spacing
<section className="py-section px-card">
  <div className="flex gap-inline">...</div>
</section>

// ❌ Avoid — raw numeric spacing that varies per component
<section className="py-20 px-6">
```

---

## Typography Scale

| Tailwind class | CSS var | Value | Line height |
|----------------|---------|-------|-------------|
| `text-hero` | `--font-size-hero` | `clamp(2rem, 5vw, 4rem)` | 1.1 |
| `text-heading` | `--font-size-heading` | `clamp(1.5rem, 3vw, 2.5rem)` | 1.2 |
| `text-body` | `--font-size-body` | `1rem` | 1.6 |
| `text-body-sm` | `--font-size-small` | `0.875rem` | 1.5 |

```tsx
// ✅ Correct
<h2 className="text-heading font-bold uppercase">Section Title</h2>
<p className="text-body leading-relaxed">Body copy</p>

// ❌ Avoid
<h2 className="text-3xl font-bold uppercase">Section Title</h2>
<p className="text-lg leading-relaxed">Body copy</p>
```

---

## Semantic Color Tokens

| Tailwind class | CSS var | Use case |
|----------------|---------|---------|
| `text-brand-primary` / `bg-brand-primary` | `--color-brand-primary` | Primary CTAs, accent highlights |
| `text-brand-secondary` / `bg-brand-secondary` | `--color-brand-secondary` | Secondary accents |
| `bg-surface-base` | `--color-surface-base` | Page background |
| `bg-surface-elevated` | `--color-surface-elevated` | Cards, panels, elevated surfaces |

```tsx
// ✅ Correct — semantic meaning
<button className="bg-brand-primary text-white">Buy Tickets</button>
<div className="bg-surface-elevated rounded-md p-card">Content</div>

// ❌ Avoid — raw palette values with no semantic meaning
<button className="bg-accent-9 text-white">Buy Tickets</button>
```

---

## Section Component Pattern

Every page section must use `<SectionBase>`:

```tsx
import { SectionBase } from '@/components/sections/SectionBase'

export function MySection({
  sectionOrder,
  visible,
  // ...other props
}: MySectionProps) {
  return (
    <SectionBase
      id="my-section"
      sectionOrder={sectionOrder}
      visible={visible}
      themeColor="foreground card border"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section content */}
      </div>
    </SectionBase>
  )
}
```

`SectionBase` handles:
- `if (!visible) return null` guard
- `<div style={{ order: sectionOrder }}>` for CSS flex ordering
- `<Separator>` between sections
- `<section id className="py-24 px-4 scanline-effect">` wrapper
- Optional `data-theme-color` attribute

**Do not** replicate this boilerplate manually in new sections.

---

## Complete Example

```tsx
import { SectionBase } from '@/components/sections/SectionBase'

interface ExampleSectionProps {
  sectionOrder: number
  visible: boolean
  sectionLabel: string
}

export function ExampleSection({ sectionOrder, visible, sectionLabel }: ExampleSectionProps) {
  return (
    <SectionBase
      id="example"
      sectionOrder={sectionOrder}
      visible={visible}
      themeColor="foreground muted-foreground card border"
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-heading font-bold uppercase tracking-tighter mb-section">
          {sectionLabel}
        </h2>
        <p className="text-body text-muted-foreground max-w-prose">
          Example content goes here.
        </p>
      </div>
    </SectionBase>
  )
}
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/layers.css` | Single source of truth for all z-index values |
| `src/lib/layer-contract.ts` | TypeScript mirror of `layers.css` |
| `src/index.css` | CSS custom properties for all design tokens |
| `src/lib/design-tokens.ts` | TypeScript constants + preset definitions |
| `tailwind.config.js` | Semantic Tailwind utilities |
| `src/components/sections/SectionBase.tsx` | Canonical section wrapper component |
