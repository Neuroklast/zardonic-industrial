import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { applyAppearanceConfig } from '@/lib/apply-appearance-config'

describe('applyAppearanceConfig', () => {
  let root: HTMLElement

  beforeEach(() => {
    root = document.documentElement
  })

  afterEach(() => {
    root.removeAttribute('style')
  })

  it('applies hex accent colors as CSS variables', () => {
    const applied = applyAppearanceConfig(
      { accentColor: '#dc2626', accentColorSecondary: '#7c3aed' },
      root,
    )
    expect(applied['--accent']).toMatch(/^oklch\(/)
    expect(applied['--accent-secondary']).toMatch(/^oklch\(/)
  })

  it('applies theme oklch colors', () => {
    const applied = applyAppearanceConfig(
      {
        theme: {
          primaryColor: 'oklch(0.50 0.22 25)',
          fontHeading: 'system-ui, sans-serif',
        },
      },
      root,
    )
    expect(applied['--primary']).toBe('oklch(0.50 0.22 25)')
    expect(applied['--font-heading']).toBe('system-ui, sans-serif')
  })

  it('applies theme font sizes as CSS variables', () => {
    const applied = applyAppearanceConfig(
      {
        theme: {
          headingFontSize: '3rem',
          bodyFontSize: '1.125rem',
          monoFontSize: '0.875rem',
        },
      },
      root,
    )
    expect(applied['--heading-font-size']).toBe('3rem')
    expect(applied['--body-font-size']).toBe('1.125rem')
    expect(applied['--mono-font-size']).toBe('0.875rem')
  })

  it('applies surface backgrounds with hex fallback and oklch alpha', () => {
    const applied = applyAppearanceConfig(
      {
        theme: { cardColor: 'oklch(0.05 0 0)' },
        sectionPanelOpacity: 0.55,
        cardSurfaceOpacity: 0.85,
      },
      root,
    )
    expect(applied['--surface-section-bg-fallback']).toMatch(/^rgba\(/)
    expect(applied['--surface-section-bg']).toBe('oklch(0.05 0 0 / 0.55)')
    expect(applied['--surface-card-bg-fallback']).toMatch(/^rgba\(/)
    expect(applied['--surface-card-bg']).toBe('oklch(0.05 0 0 / 0.85)')
    expect(applied['--surface-section-backdrop']).toBe('blur(4px)')
  })

  it('applies transparent surfaces when section opacity is zero', () => {
    const applied = applyAppearanceConfig(
      {
        theme: { cardColor: '#000001' },
        sectionPanelOpacity: 0,
        cardSurfaceOpacity: 0.85,
      },
      root,
    )
    expect(applied['--surface-section-bg-fallback']).toBe('rgba(0, 0, 1, 0)')
    expect(applied['--surface-section-bg']).toBe('oklch(0.00 0.00 240 / 0)')
    expect(applied['--surface-section-backdrop']).toBe('none')
  })

  it('applies vignette to both CSS variable names', () => {
    const applied = applyAppearanceConfig({ vignetteOpacity: 0.45 }, root)
    expect(applied['--vignette-opacity']).toBe('0.45')
    expect(applied['--crt-vignette-opacity']).toBe('0.45')
  })

  it('recomputes surface colors when card color changes', () => {
    const dark = applyAppearanceConfig(
      { theme: { cardColor: 'oklch(0.05 0 0)' }, sectionPanelOpacity: 0.5 },
      root,
    )
    const light = applyAppearanceConfig(
      { theme: { cardColor: 'oklch(0.90 0 0)' }, sectionPanelOpacity: 0.5 },
      root,
    )
    expect(dark['--surface-section-bg']).not.toBe(light['--surface-section-bg'])
  })
})