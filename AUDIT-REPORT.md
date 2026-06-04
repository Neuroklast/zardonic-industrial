# Design System Audit Report

**Date:** 2026-06-04  
**Repository:** Neuroklast/zardonic-industrial  
**Auditor:** GitHub Copilot Coding Agent

---

## Summary

| Area | Findings | Status |
|------|----------|--------|
| Z-Index violations | 12 hardcoded values | ✅ Fixed |
| Design tokens (CSS) | Missing central scale | ✅ Fixed |
| Design tokens (TS) | No runtime token file | ✅ Fixed |
| Section composition | No shared base component | ✅ Fixed (3 sections) |
| Tailwind config | No semantic utilities | ✅ Fixed |
| Admin registry | 140 fields, complex UX | 📋 Documented |
| Section padding variance | py-4 … py-24 in components | 📋 Documented |

---

## 1.1 Z-Index Layer Audit

### Methodology
Searched all `.css`, `.tsx`, `.ts` files for `z-index:` values that do **not** reference a `var(--z-*)` CSS custom property.

### Findings — 12 violations found (all in `src/index.css`)

| Selector | Old value | Layer used | Impact |
|----------|-----------|------------|--------|
| `.hero-bg-video` | `z-index: 0` | `var(--z-base)` | medium |
| `.hero-bg-overlay` | `z-index: 1` | `var(--z-above)` | medium |
| `.matrix-rain-canvas` | `z-index: 2` | `var(--z-fx)` | medium |
| `.hero-content-wrapper` | `z-index: 10` | `var(--z-content)` | medium |
| `.glitch-text::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.glitch-text::after` | `z-index: -2` | `var(--z-pseudo-below-2)` | low |
| `.cyber-grid::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.dot-matrix-logo::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.scan-reveal::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.data-stream::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.holographic-materialize::before` | `z-index: -1` | `var(--z-pseudo-below)` | low |
| `.holographic-materialize::after` | `z-index: -2` | `var(--z-pseudo-below-2)` | low |

### Additional issue: missing `isolation: isolate`

The 6 containers below had pseudo-elements with negative `z-index` but no `isolation: isolate`. Without `isolation`, negative z-index values escape to ancestor stacking contexts, causing layout bugs.

- `.glitch-text`
- `.cyber-grid`
- `.dot-matrix-logo`
- `.scan-reveal`
- `.data-stream`
- `.holographic-materialize`

### Fix applied
- Added `--z-pseudo-below: -1` and `--z-pseudo-below-2: -2` to `src/layers.css`
- Added matching constants to `src/lib/layer-contract.ts`
- Replaced all 12 raw values in `src/index.css` with CSS custom properties
- Added `isolation: isolate` to the 6 affected containers

---

## 1.2 Design Token Audit

### Spacing inconsistencies

Section-level vertical padding varied significantly across components:

| Component | Padding class | Value |
|-----------|--------------|-------|
| `AppBioSection` | `py-24` | 6 rem |
| `AppGigsSection` | `py-24` | 6 rem |
| `AppReleasesSection` | `py-24` | 6 rem |
| `GallerySection` | `py-24` | 6 rem |
| `CreditHighlightsSection` | `py-24` | 6 rem |
| `SponsoringSection` | `py-24` | 6 rem |
| Admin panel tabs | `p-4` / `p-6` (mixed) | 1–1.5 rem |
| Card components | `px-4 py-3` / `p-6` (mixed) | varies |

**Hardcoded spacing class instances in `/src/components`: 190**

### Typography inconsistencies

Section headings all use `text-4xl md:text-6xl` (good consistency for headings), but body text varies widely:

- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl` all appear in components.
- **Hardcoded font-size class instances: 243**
- No semantic scale (e.g. `text-hero`, `text-heading`, `text-body`) existed before this PR.

### Colors

The design uses `--color-accent-9` / `--color-neutral-*` from Radix color scale, mapped via Tailwind. Semantic aliases (`brand-primary`, `surface-base`) were missing — components used raw palette values directly.

### Border radius

Most components use Tailwind's built-in `rounded-*` utilities which already map to `var(--radius-*)` in `tailwind.config.js`. 16 instances of plain `rounded` (no suffix) remain — these are minor.

### Fix applied
- Added CSS custom properties to `src/index.css` `:root` block:
  - Spacing: `--spacing-section`, `--spacing-card`, `--spacing-inline`
  - Typography: `--font-size-hero`, `--font-size-heading`, `--font-size-body`, `--font-size-small`
  - Colors: `--color-brand-primary`, `--color-brand-secondary`, `--color-surface-base`, `--color-surface-elevated`
  - Radius: `--radius-card`, `--radius-button`, `--radius-input`
- Added responsive overrides (mobile: section=4rem, card=1rem)
- Created `src/lib/design-tokens.ts` with TypeScript token constants and `DESIGN_PRESETS`
- Extended `tailwind.config.js` with semantic utilities: `py-section`, `p-card`, `gap-inline`, `text-hero`, `text-heading`, `text-body`, `text-body-sm`, `bg-brand-primary`, `bg-surface-base`, etc.

---

## 1.3 Admin Panel Complexity Audit

### SECTION_REGISTRY & DESIGN_REGISTRY

| Metric | Count |
|--------|-------|
| Total config fields | 140 |
| Disclosure: `basic` | 52 |
| Disclosure: `advanced` | 75 |
| Disclosure: `expert` | 13 |

### Identified redundancies

1. **Container width duplication** — `containerMaxWidth` (global) + `containerMaxWidth` per-section override = 2 separate controls for the same concept.
2. **Padding granularity** — `sectionPaddingY` and `sectionPaddingX` are separate sliders, but users think in terms of "compact / standard / spacious", not raw rem values.
3. **Font stack duplication** — `headingFontFamily`, `bodyFontFamily`, `monoFontFamily` all have both a select AND a text input for custom values = 6 fields instead of 3.
4. **Animation toggles overlap** — `scanlineEffect`, `glitchText`, `matrixRain`, `noiseOverlay`, `crtOverlay`, and `fullPageNoise` are separate booleans with no grouping concept.
5. **Expert fields**: 13 fields at `expert` level; most are CSS overrides that could be hidden behind a "Custom CSS" accordion.

### Recommendation

Group related fields into preset selectors:
- **Spacing preset** (compact / standard / spacious) replaces 4 padding fields
- **Effects intensity** (off / subtle / full) replaces 6 animation toggles
- Keep individual controls as `advanced` overrides for power users

See `DESIGN-TOKENS-PROPOSAL.md` for the full token proposal.

---

## 1.4 Component Architecture Audit

### Common section pattern

All page sections share identical wrapper boilerplate:

```tsx
if (!visible) return null

return (
  <div style={{ order: sectionOrder }}>
    <Separator className="bg-border" />
    <section id="…" className="py-24 px-4 scanline-effect" data-theme-color="…">
      {/* content */}
    </section>
  </div>
)
```

**Components using this pattern (before refactor):**
`AppBioSection`, `AppGigsSection`, `AppReleasesSection`, `AppMediaSection`,
`GallerySection`, `CreditHighlightsSection`, `SponsoringSection`, `NewsletterSection`,
`AppConnectSection`, `AppShellSection`

### Fix applied
- Created `src/components/sections/SectionBase.tsx` that encapsulates the full wrapper pattern
- Refactored `AppBioSection`, `AppGigsSection`, `AppReleasesSection` to use `SectionBase`

### Remaining sections (future PRs)
`AppMediaSection`, `GallerySection`, `CreditHighlightsSection`, `SponsoringSection`,
`NewsletterSection`, `AppConnectSection`, `AppShellSection`

---

## 1.5 Tailwind Configuration Audit

### Before audit
- All spacing mapped through `var(--size-*)` CSS vars (good)
- No semantic scale (bad — forces raw numeric values like `py-24`)
- No semantic color aliases
- No fluid typography utilities

### After audit / fix
- Added `spacing.section` → `var(--spacing-section)` (6rem desktop, 4rem mobile)
- Added `spacing.card` → `var(--spacing-card)` (1.5rem desktop, 1rem mobile)
- Added `spacing.inline` → `var(--spacing-inline)` (1rem)
- Added `fontSize.hero` → fluid clamp(2rem, 5vw, 4rem)
- Added `fontSize.heading` → fluid clamp(1.5rem, 3vw, 2.5rem)
- Added `fontSize.body` → 1rem
- Added `fontSize.body-sm` → 0.875rem
- Added color aliases: `brand-primary`, `brand-secondary`, `surface-base`, `surface-elevated`

---

## Prioritised Finding List

| Priority | Finding | Effort | Status |
|----------|---------|--------|--------|
| 🔴 High | 12 raw z-index values bypassing layer system | Low | ✅ Fixed |
| 🔴 High | Missing `isolation: isolate` on 6 pseudo-element containers | Low | ✅ Fixed |
| 🟠 Medium | No design token system (CSS vars + TS constants) | Medium | ✅ Fixed |
| 🟠 Medium | No semantic Tailwind utilities | Low | ✅ Fixed |
| 🟠 Medium | Repeated section wrapper boilerplate (10 components) | Medium | ✅ Partial (3/10) |
| 🟡 Low | 190 hardcoded spacing classes in components | High | 📋 Documented |
| 🟡 Low | 243 hardcoded font-size classes in components | High | 📋 Documented |
| 🟡 Low | Admin panel: 140 fields with 75 `advanced` ones | High | 📋 Documented |
| 🟡 Low | Admin panel: container width duplication | Low | 📋 Documented |
