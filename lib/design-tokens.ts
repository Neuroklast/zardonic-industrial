/**
 * DESIGN TOKEN SYSTEM
 * ====================
 * Central source of truth for design values used across the application.
 *
 * Architecture:
 *  - CSS custom properties in `src/index.css` (`:root`) are the runtime values.
 *  - Tailwind utilities `py-section`, `text-heading`, `text-brand-primary`, etc.
 *    map to these CSS variables via `tailwind.config.js`.
 *  - This file provides TypeScript-level documentation and `DESIGN_PRESETS`
 *    for the admin panel's preset selector.
 *
 * Usage:
 *  - In components: prefer Tailwind classes (`py-section`, `text-heading`).
 *  - For inline styles that must reference tokens: use `var(--spacing-section)`.
 *  - Do NOT hardcode pixel/rem values — always use a token.
 */

// ---------------------------------------------------------------------------
// Spacing tokens (mirrors --spacing-* in src/index.css)
// ---------------------------------------------------------------------------

export const SPACING_TOKENS = {
  /** Vertical padding for top-level page sections. Tailwind: `py-section` */
  section: 'var(--spacing-section)',
  /** Padding inside cards and panels. Tailwind: `p-card` */
  card: 'var(--spacing-card)',
  /** Gap between inline elements. Tailwind: `gap-inline` */
  inline: 'var(--spacing-inline)',
} as const

// ---------------------------------------------------------------------------
// Typography tokens (mirrors --font-size-* in src/index.css)
// ---------------------------------------------------------------------------

export const TYPOGRAPHY_TOKENS = {
  /** Fluid hero headline. Tailwind: `text-hero` */
  hero: 'var(--font-size-hero)',
  /** Fluid section heading. Tailwind: `text-heading` */
  heading: 'var(--font-size-heading)',
  /** Body copy. Tailwind: `text-body` */
  body: 'var(--font-size-body)',
  /** Small / caption text. Tailwind: `text-body-sm` */
  small: 'var(--font-size-small)',
} as const

// ---------------------------------------------------------------------------
// Semantic color tokens (mirrors --color-brand-* and --color-surface-* in src/index.css)
// ---------------------------------------------------------------------------

export const COLOR_TOKENS = {
  brand: {
    /** Primary CTA buttons, links. Tailwind: `text-brand-primary` / `bg-brand-primary` */
    primary: 'var(--color-brand-primary)',
    /** Secondary accent. Tailwind: `text-brand-secondary` / `bg-brand-secondary` */
    secondary: 'var(--color-brand-secondary)',
  },
  surface: {
    /** Page background. Tailwind: `bg-surface-base` */
    base: 'var(--color-surface-base)',
    /** Cards, panels. Tailwind: `bg-surface-elevated` */
    elevated: 'var(--color-surface-elevated)',
  },
} as const

// ---------------------------------------------------------------------------
// Border radius tokens (mirrors --radius-* in src/index.css)
// ---------------------------------------------------------------------------

export const RADIUS_TOKENS = {
  /** Cards and panels. */
  card: 'var(--radius-card)',
  /** Buttons. */
  button: 'var(--radius-button)',
  /** Inputs. */
  input: 'var(--radius-input)',
} as const

// ---------------------------------------------------------------------------
// Design presets
// ---------------------------------------------------------------------------

/**
 * Pre-built spacing presets for the admin panel's "Layout Preset" selector.
 * Each preset maps to a set of CSS variable overrides applied via inline style
 * on the `:root` element (handled by the theme applier in `useAppTheme`).
 *
 * Extend this object whenever a new preset is added; the admin panel
 * automatically discovers presets from this list.
 */
export const DESIGN_PRESETS = {
  compact: {
    label: 'Compact',
    description: 'Reduced spacing for information-dense layouts',
    variables: {
      '--spacing-section': '4rem',
      '--spacing-card': '1rem',
      '--spacing-inline': '0.75rem',
      '--font-size-hero': 'clamp(1.75rem, 4vw, 3rem)',
      '--font-size-heading': 'clamp(1.25rem, 2.5vw, 2rem)',
    },
  },
  standard: {
    label: 'Standard',
    description: 'Balanced spacing — the default',
    variables: {
      '--spacing-section': '6rem',
      '--spacing-card': '1.5rem',
      '--spacing-inline': '1rem',
      '--font-size-hero': 'clamp(2rem, 5vw, 4rem)',
      '--font-size-heading': 'clamp(1.5rem, 3vw, 2.5rem)',
    },
  },
  spacious: {
    label: 'Spacious',
    description: 'Generous spacing for expressive layouts',
    variables: {
      '--spacing-section': '8rem',
      '--spacing-card': '2rem',
      '--spacing-inline': '1.25rem',
      '--font-size-hero': 'clamp(2.5rem, 6vw, 5rem)',
      '--font-size-heading': 'clamp(1.75rem, 3.5vw, 3rem)',
    },
  },
} as const satisfies Record<
  string,
  {
    label: string
    description: string
    variables: Record<`--${string}`, string>
  }
>

export type DesignPresetKey = keyof typeof DESIGN_PRESETS

/**
 * Consolidated design token object — useful when you need to pass the full
 * token map to a utility function.
 */
export const DESIGN_TOKENS = {
  spacing: SPACING_TOKENS,
  typography: TYPOGRAPHY_TOKENS,
  colors: COLOR_TOKENS,
  radius: RADIUS_TOKENS,
} as const
