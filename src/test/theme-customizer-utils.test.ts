import { describe, it, expect } from 'vitest'
import {
  getAnimationEnabled,
  getAnimationIntensity,
  setAnimationEnabled,
  setAnimationIntensity,
  SECTION_LABELS,
} from '@/lib/theme-customizer-utils'
import type { ThemeSettings, SectionVisibility } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const emptyTheme: ThemeSettings = {}

const themeWithAnimations: ThemeSettings = {
  animationSettings: {
    glitchEnabled: true,
    circuitBackgroundEnabled: false,
  },
  overlayEffects: {
    scanlines: { enabled: true, intensity: 0.3 },
    crt: { enabled: false, intensity: 0.4 },
    noise: { enabled: true, intensity: 0.2 },
    vignette: { enabled: false, intensity: 0.5 },
    chromatic: { enabled: true, intensity: 0.6 },
    dotMatrix: { enabled: false, intensity: 0.1 },
  },
}

// ---------------------------------------------------------------------------
describe('getAnimationEnabled()', () => {
  it('returns correct value for each animation type', () => {
    expect(getAnimationEnabled(themeWithAnimations, 'glitch')).toBe(true)
    expect(getAnimationEnabled(themeWithAnimations, 'scanlines')).toBe(true)
    expect(getAnimationEnabled(themeWithAnimations, 'crt')).toBe(false)
    expect(getAnimationEnabled(themeWithAnimations, 'noise')).toBe(true)
    expect(getAnimationEnabled(themeWithAnimations, 'vignette')).toBe(false)
    expect(getAnimationEnabled(themeWithAnimations, 'chromatic')).toBe(true)
    expect(getAnimationEnabled(themeWithAnimations, 'dotMatrix')).toBe(false)
    expect(getAnimationEnabled(themeWithAnimations, 'particles')).toBe(false)
  })

  it('returns false for unknown animation ID', () => {
    expect(getAnimationEnabled(emptyTheme, 'unknown')).toBe(false)
  })

  it('returns false defaults for empty theme', () => {
    const animations = ['glitch', 'scanlines', 'crt', 'noise', 'vignette', 'chromatic', 'dotMatrix', 'particles']
    for (const anim of animations) {
      expect(getAnimationEnabled(emptyTheme, anim)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
describe('getAnimationIntensity()', () => {
  it('returns configured intensity values', () => {
    expect(getAnimationIntensity(themeWithAnimations, 'scanlines')).toBe(0.3)
    expect(getAnimationIntensity(themeWithAnimations, 'crt')).toBe(0.4)
    expect(getAnimationIntensity(themeWithAnimations, 'noise')).toBe(0.2)
    expect(getAnimationIntensity(themeWithAnimations, 'chromatic')).toBe(0.6)
    expect(getAnimationIntensity(themeWithAnimations, 'dotMatrix')).toBe(0.1)
  })

  it('returns 0.5 default for empty theme', () => {
    const effects = ['scanlines', 'crt', 'noise', 'vignette', 'chromatic', 'dotMatrix']
    for (const effect of effects) {
      expect(getAnimationIntensity(emptyTheme, effect)).toBe(0.5)
    }
  })

  it('returns 0.5 for unknown animation ID', () => {
    expect(getAnimationIntensity(emptyTheme, 'unknown')).toBe(0.5)
  })
})

// ---------------------------------------------------------------------------
describe('setAnimationEnabled()', () => {
  it('toggles glitch animation', () => {
    const result = setAnimationEnabled(emptyTheme, 'glitch', true)
    expect(result.animationSettings?.glitchEnabled).toBe(true)
  })

  it('toggles scanlines overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'scanlines', true)
    expect(result.overlayEffects?.scanlines?.enabled).toBe(true)
    expect(result.animationSettings?.scanlineEnabled).toBe(true)
  })

  it('toggles crt overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'crt', true)
    expect(result.overlayEffects?.crt?.enabled).toBe(true)
    expect(result.animationSettings?.crtEnabled).toBe(true)
  })

  it('toggles noise overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'noise', true)
    expect(result.overlayEffects?.noise?.enabled).toBe(true)
    expect(result.animationSettings?.noiseEnabled).toBe(true)
  })

  it('toggles vignette overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'vignette', true)
    expect(result.overlayEffects?.vignette?.enabled).toBe(true)
  })

  it('toggles chromatic overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'chromatic', true)
    expect(result.overlayEffects?.chromatic?.enabled).toBe(true)
    expect(result.animationSettings?.chromaticEnabled).toBe(true)
  })

  it('toggles dotMatrix overlay', () => {
    const result = setAnimationEnabled(emptyTheme, 'dotMatrix', true)
    expect(result.overlayEffects?.dotMatrix?.enabled).toBe(true)
  })

  it('toggles particles (circuitBackground)', () => {
    const result = setAnimationEnabled(emptyTheme, 'particles', true)
    expect(result.animationSettings?.circuitBackgroundEnabled).toBe(true)
  })

  it('returns unchanged theme for unknown animation ID', () => {
    const result = setAnimationEnabled(emptyTheme, 'unknown', true)
    expect(result).toEqual(emptyTheme)
  })
})

// ---------------------------------------------------------------------------
describe('setAnimationIntensity()', () => {
  it('sets scanlines intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'scanlines', 0.8)
    expect(result.overlayEffects?.scanlines?.intensity).toBe(0.8)
  })

  it('sets crt intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'crt', 0.7)
    expect(result.overlayEffects?.crt?.intensity).toBe(0.7)
  })

  it('sets noise intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'noise', 0.1)
    expect(result.overlayEffects?.noise?.intensity).toBe(0.1)
  })

  it('sets vignette intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'vignette', 0.9)
    expect(result.overlayEffects?.vignette?.intensity).toBe(0.9)
  })

  it('sets chromatic intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'chromatic', 0.2)
    expect(result.overlayEffects?.chromatic?.intensity).toBe(0.2)
  })

  it('sets dotMatrix intensity', () => {
    const result = setAnimationIntensity(emptyTheme, 'dotMatrix', 0.05)
    expect(result.overlayEffects?.dotMatrix?.intensity).toBe(0.05)
  })

  it('returns unchanged theme for unknown animation ID', () => {
    const result = setAnimationIntensity(emptyTheme, 'unknown', 0.5)
    expect(result).toEqual(emptyTheme)
  })
})

// ---------------------------------------------------------------------------
describe('SECTION_LABELS', () => {
  const expectedKeys: (keyof SectionVisibility)[] = [
    'bio',
    'music',
    'gigs',
    'releases',
    'gallery',
    'connect',
    'creditHighlights',
    'shell',
    'contact',
  ]

  it('has all expected section keys', () => {
    for (const key of expectedKeys) {
      expect(SECTION_LABELS).toHaveProperty(key)
      expect(typeof SECTION_LABELS[key]).toBe('string')
    }
  })

  it('has no extra keys', () => {
    expect(Object.keys(SECTION_LABELS).sort()).toEqual(expectedKeys.sort())
  })
})
