import { describe, it, expect } from 'vitest'
import { validateThemeSettings, isThemeValid } from '@/lib/theme-validator'
import type { ThemeSettings } from '@/lib/types'

// ---------------------------------------------------------------------------
describe('validateThemeSettings()', () => {
  it('returns no errors for valid settings', () => {
    const theme: ThemeSettings = {
      heroStyle: 'glitch-parallax',
      loadingScreenType: 'cyberpunk',
      overlayEffects: {
        scanlines: { enabled: true, intensity: 0.3 },
        crt: { enabled: false, intensity: 0.4 },
      },
    }
    const errors = validateThemeSettings(theme)
    expect(errors).toHaveLength(0)
  })

  it('returns no errors for empty settings', () => {
    expect(validateThemeSettings({})).toHaveLength(0)
  })

  it('warns on invalid heroStyle', () => {
    const errors = validateThemeSettings({ heroStyle: 'unknown-style' })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('heroStyle')
    expect(errors[0].severity).toBe('warning')
    expect(errors[0].message).toContain('unknown-style')
  })

  it('warns on invalid loadingScreenType', () => {
    const errors = validateThemeSettings({ loadingScreenType: 'invalid' })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('loadingScreenType')
    expect(errors[0].severity).toBe('warning')
  })

  it('warns on overlay intensity > 1', () => {
    const errors = validateThemeSettings({
      overlayEffects: { scanlines: { intensity: 1.5 } },
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('overlayEffects.scanlines.intensity')
  })

  it('warns on overlay intensity < 0', () => {
    const errors = validateThemeSettings({
      overlayEffects: { noise: { intensity: -0.1 } },
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('overlayEffects.noise.intensity')
  })

  it('validates all overlay effect types', () => {
    const effects = ['scanlines', 'crt', 'noise', 'vignette', 'chromatic', 'dotMatrix'] as const
    for (const effect of effects) {
      const errors = validateThemeSettings({
        overlayEffects: { [effect]: { intensity: 2.0 } },
      })
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors[0].field).toBe(`overlayEffects.${effect}.intensity`)
    }
  })

  it('accepts valid heroStyle values', () => {
    const validStyles = ['glitch-parallax', 'chromatic-hover', 'minimal', 'default']
    for (const style of validStyles) {
      expect(validateThemeSettings({ heroStyle: style })).toHaveLength(0)
    }
  })

  it('accepts valid loadingScreenType values', () => {
    const validTypes = ['3d-model', 'code-rain', 'cyberpunk', 'minimal']
    for (const type of validTypes) {
      expect(validateThemeSettings({ loadingScreenType: type })).toHaveLength(0)
    }
  })
})

// ---------------------------------------------------------------------------
describe('isThemeValid()', () => {
  it('returns true for valid theme', () => {
    expect(isThemeValid({ heroStyle: 'default' })).toBe(true)
  })

  it('returns true for empty theme (no errors)', () => {
    expect(isThemeValid({})).toBe(true)
  })

  it('returns true even with warnings (no errors)', () => {
    // validateThemeSettings only produces warnings, not errors
    expect(isThemeValid({ heroStyle: 'invalid' })).toBe(true)
  })
})
