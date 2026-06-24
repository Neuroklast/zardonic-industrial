# Migration Guide

> **Note:** Paths below use `src/` as in the original migration. The Next.js runtime also mirrors many modules at the repo root (`components/`, `lib/`, `layouts/`, `styles/`). Prefer whichever path your import alias resolves to.

This guide explains how to migrate existing components to the design token system.
Migrations are **incremental** — existing code continues to work unchanged. Only migrate when you are already editing a component.

---

## Overview of Changes

| Old pattern | New pattern | Where defined |
|-------------|-------------|---------------|
| Raw z-index integers | `var(--z-*)` CSS custom properties | `src/layers.css` |
| `py-24 px-4` on sections | `<SectionBase>` component | `src/components/sections/SectionBase.tsx` |
| `text-3xl text-4xl` etc. | `text-heading`, `text-body` | `tailwind.config.js` |
| `py-20 py-16` etc. | `py-section` | `tailwind.config.js` |
| `p-6 gap-4` on cards | `p-card gap-inline` | `tailwind.config.js` |
| Direct palette colors (`accent-9`) | Semantic aliases (`brand-primary`) | `tailwind.config.js` |

---

## 1. Migrating a Section to `SectionBase`

### Before

```tsx
import { Separator } from '@/components/ui/separator'

function MySection({ sectionOrder, visible, ...props }: Props) {
  if (!visible) return null

  return (
    <div style={{ order: sectionOrder }}>
      <Separator className="bg-border" />
      <section id="my-section" className="py-24 px-4 scanline-effect" data-theme-color="foreground card border">
        {/* content */}
      </section>
    </div>
  )
}
```

### After

```tsx
import { SectionBase } from '@/components/sections/SectionBase'

function MySection({ sectionOrder, visible, ...props }: Props) {
  return (
    <SectionBase
      id="my-section"
      sectionOrder={sectionOrder}
      visible={visible}
      themeColor="foreground card border"
    >
      {/* content */}
    </SectionBase>
  )
}
```

**Notes:**
- Remove the `Separator` import — `SectionBase` handles it internally.
- Remove the `if (!visible) return null` guard — `SectionBase` handles it.

---

## 2. Migrating Typography Classes

```tsx
// Before
<h2 className="text-4xl md:text-6xl font-bold">Title</h2>
<h3 className="text-2xl font-semibold">Subtitle</h3>
<p className="text-lg leading-relaxed">Body copy</p>
<span className="text-sm text-muted-foreground">Caption</span>

// After
<h2 className="text-heading font-bold">Title</h2>
<h3 className="text-xl font-semibold">Subtitle</h3>  {/* text-xl stays unchanged */}
<p className="text-body leading-relaxed">Body copy</p>
<span className="text-body-sm text-muted-foreground">Caption</span>
```

**Token mapping:**
| Old class | New class |
|-----------|-----------|
| `text-4xl` (hero/main heading) | `text-hero` |
| `text-3xl` / `text-4xl` (section heading) | `text-heading` |
| `text-base` / `text-lg` (body) | `text-body` |
| `text-sm` (small / caption) | `text-body-sm` |

---

## 3. Migrating Spacing Classes

```tsx
// Before — section
<section className="py-20 px-4">

// After — section
<section className="py-section px-card">

// Before — card interior
<div className="p-6">

// After — card interior
<div className="p-card">

// Before — inline elements
<div className="flex gap-4">

// After — inline elements
<div className="flex gap-inline">
```

---

## 4. Migrating Z-Index Values

**CSS files:**

```css
/* Before */
.my-overlay { z-index: 30; }
.my-pseudo::before { z-index: -1; }

/* After */
.my-overlay { z-index: var(--z-overlay); }
.my-container { isolation: isolate; }   /* required when using negative z-index */
.my-container::before { z-index: var(--z-pseudo-below); }
```

**Inline styles (TSX):**

```tsx
// Before
<div style={{ zIndex: 30 }}>

// After
<div style={{ zIndex: 'var(--z-overlay)' } as React.CSSProperties}>
```

**Import the TypeScript constants for type safety:**

```tsx
import { LAYERS } from '@/lib/layer-contract'

<div style={{ zIndex: LAYERS.OVERLAY }}>
```

---

## 5. Migrating Color Classes

```tsx
// Before
<button className="bg-accent-9 text-white">CTA</button>
<div className="bg-neutral-1">Page background</div>
<div className="bg-neutral-2">Card</div>

// After
<button className="bg-brand-primary text-white">CTA</button>
<div className="bg-surface-base">Page background</div>
<div className="bg-surface-elevated">Card</div>
```

---

## Backward Compatibility

All existing components continue to work. The new tokens are **additive**:

- `py-section` resolves to `6rem` by default — same as the old `py-24`
- `text-heading` resolves to `clamp(1.5rem, 3vw, 2.5rem)` — visually close to `text-4xl`
- `bg-brand-primary` resolves to `var(--color-accent-9)` — identical to what components used before

No breaking changes. Migrate incrementally as you touch files.

---

## Components still using old patterns (prioritised list)

All page sections have been migrated to `SectionBase` as of this PR. No components
with the old `div > Separator > section` boilerplate remain.
