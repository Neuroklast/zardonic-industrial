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
})