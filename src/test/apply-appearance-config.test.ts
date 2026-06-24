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

  it('applies theme font sizes to semantic typography tokens only', () => {
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
    expect(applied['--font-size-heading']).toBe('3rem')
    expect(applied['--font-size-body']).toBe('1.125rem')
    expect(applied['--body-font-size']).toBe('1.125rem')
    expect(applied['--mono-font-size']).toBe('0.875rem')
  })

  it('propagates foreground color to card and popover foreground aliases', () => {
    const applied = applyAppearanceConfig(
      {
        theme: {
          foregroundColor: '#e2e8f0',
        },
      },
      root,
    )
    expect(applied['--foreground']).toMatch(/^oklch\(/)
    expect(applied['--card-foreground']).toBe(applied['--foreground'])
    expect(applied['--popover-foreground']).toBe(applied['--foreground'])
  })

  it('applies muted foreground independently from primary text', () => {
    const applied = applyAppearanceConfig(
      {
        theme: {
          foregroundColor: '#ffffff',
          mutedForegroundColor: '#94a3b8',
        },
      },
      root,
    )
    expect(applied['--foreground']).toMatch(/^oklch\(/)
    expect(applied['--muted-foreground']).toMatch(/^oklch\(/)
    expect(applied['--muted-foreground']).not.toBe(applied['--foreground'])
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
    expect(applied['--surface-section-border-opacity']).toBe('0.6')
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
    expect(applied['--surface-section-border-opacity']).toBe('0')
  })

  it('applies vignette to both CSS variable names', () => {
    const applied = applyAppearanceConfig({ vignetteOpacity: 0.45 }, root)
    expect(applied['--vignette-opacity']).toBe('0.45')
    expect(applied['--crt-vignette-opacity']).toBe('0.45')
  })

  it('applies section grid opacity CSS variable', () => {
    const applied = applyAppearanceConfig({ sectionGridOpacity: 0.2 }, root)
    expect(applied['--section-grid-opacity']).toBe('0.2')
  })

  it('applies chromatic strength CSS variable', () => {
    const applied = applyAppearanceConfig({ chromaticStrength: 0.25 }, root)
    expect(applied['--chromatic-strength']).toBe('0.25')
  })

  it('toggles global effect layers for live preview', () => {
    const crt = document.createElement('div')
    crt.className = 'crt-overlay'
    const scanline = document.createElement('div')
    scanline.className = 'crt-scanline-bg'
    const noise = document.createElement('div')
    noise.className = 'full-page-noise'
    document.body.append(crt, scanline, noise)

    applyAppearanceConfig({
      crtEnabled: false,
      scanlineEnabled: false,
      noiseEnabled: false,
    })

    expect(crt.style.display).toBe('none')
    expect(scanline.style.display).toBe('none')
    expect(noise.style.display).toBe('none')

    applyAppearanceConfig({
      crtEnabled: true,
      scanlineEnabled: true,
      noiseEnabled: true,
    })

    expect(crt.style.display).toBe('')
    expect(scanline.style.display).toBe('')
    expect(noise.style.display).toBe('')

    crt.remove()
    scanline.remove()
    noise.remove()
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