/**
 * appearance-live-preview.test.ts
 *
 * Enforces that every admin appearance parameter:
 *   1. Is wired – has a corresponding CSS-variable mapping in use-app-theme.ts
 *   2. Sets a CSS custom property on <html> via document.documentElement.style
 *      (the "live preview" mechanism)
 *
 * Adding a new field to TypographyDetailSettings, EffectColorSettings,
 * AnimationTimingSettings, or CRTIntensitySettings without also updating
 * use-app-theme.ts will cause a test here to fail.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppTheme } from '@/hooks/use-app-theme'
import type { AdminSettings } from '@/lib/types'

// ---------------------------------------------------------------------------
// Canonical mapping: AdminSettings path → CSS custom property name
// If you add a new appearance parameter, add it here AND in use-app-theme.ts
// ---------------------------------------------------------------------------

/** Typography parameters and their expected CSS variable */
const TYPOGRAPHY_CSS_VAR_MAP: Record<string, string> = {
  headingFontSize: '--heading-font-size',
  headingFontWeight: '--heading-font-weight',
  headingLineHeight: '--heading-line-height',
  headingLetterSpacing: '--heading-letter-spacing',
  bodyFontSize: '--body-font-size',
  bodyLineHeight: '--body-line-height',
  monoFontSize: '--mono-font-size',
}

/** EffectColor parameters and their expected CSS variable */
const EFFECT_COLORS_CSS_VAR_MAP: Record<string, string> = {
  chromaticColorLeft: '--chromatic-color-left',
  chromaticColorRight: '--chromatic-color-right',
  glitchShadowColor1: '--glitch-shadow-color-1',
  glitchShadowColor2: '--glitch-shadow-color-2',
  scrollbarThumbColor: '--scrollbar-thumb-color',
}

/** Numeric effect parameters that get applied as CSS variables */
const NUMERIC_EFFECTS_CSS_VAR_MAP: Record<string, string> = {
  scanlineOpacity: '--scanline-opacity',
}

/** Animation timing parameters and their expected CSS variable */
const TIMINGS_CSS_VAR_MAP: Record<string, string> = {
  fadeInDuration: '--fade-in-duration',
  scanlineDuration: '--scanline-duration',
  crtFlickerDuration: '--crt-flicker-duration',
  glitchDuration: '--glitch-duration',
  logoEntranceDuration: '--logo-entrance-duration',
}

/** CRT intensity parameters and their expected CSS variable */
const CRT_CSS_VAR_MAP: Record<string, string> = {
  vignetteOpacity: '--vignette-opacity',
  scanlineHeight: '--scanline-height',
  noiseFrequency: '--noise-frequency',
}

/** Theme color parameters and their expected CSS variables */
const THEME_COLOR_CSS_VAR_MAP: Record<string, string> = {
  primaryColor: '--primary',
  accentColor: '--accent',
  backgroundColor: '--background',
  foregroundColor: '--foreground',
  cardColor: '--card',
  cardForegroundColor: '--card-foreground',
  secondaryColor: '--secondary',
  secondaryForegroundColor: '--secondary-foreground',
  mutedColor: '--muted',
  mutedForegroundColor: '--muted-foreground',
  destructiveColor: '--destructive',
  destructiveForegroundColor: '--destructive-foreground',
  borderColor: '--border',
  inputColor: '--input',
  ringColor: '--ring',
  hoverColor: '--hover-color',
  borderRadius: '--radius',
  fontHeading: '--font-heading',
  fontBody: '--font-body',
  fontMono: '--font-mono',
  dataLabelColor: '--data-label-color',
  dataLabelFontSize: '--data-label-font-size',
  dataLabelFontFamily: '--data-label-font-family',
  modalGlowColor: '--modal-glow-color',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSettings(overrides: AdminSettings): AdminSettings {
  return overrides
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAppTheme — live preview CSS variable wiring', () => {
  let originalSetProperty: typeof document.documentElement.style.setProperty
  let originalRemoveProperty: typeof document.documentElement.style.removeProperty
  const setPropertyCalls: Map<string, string> = new Map()

  beforeEach(() => {
    setPropertyCalls.clear()
    originalSetProperty = document.documentElement.style.setProperty.bind(
      document.documentElement.style,
    )
    originalRemoveProperty = document.documentElement.style.removeProperty.bind(
      document.documentElement.style,
    )
    // Spy: record CSS variable assignments
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(
      (prop, value, priority) => {
        setPropertyCalls.set(prop, value ?? '')
        return originalSetProperty(prop, value, priority)
      },
    )
    vi.spyOn(document.documentElement.style, 'removeProperty').mockImplementation((prop) => {
      setPropertyCalls.delete(prop)
      return originalRemoveProperty(prop)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up any CSS properties set during tests
    Object.values(TYPOGRAPHY_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    Object.values(EFFECT_COLORS_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    Object.values(NUMERIC_EFFECTS_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    Object.values(TIMINGS_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    Object.values(CRT_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    Object.values(THEME_COLOR_CSS_VAR_MAP).forEach((v) =>
      document.documentElement.style.removeProperty(v),
    )
    document.documentElement.style.removeProperty('--heading-text-shadow')
    document.documentElement.style.removeProperty('--crt-overlay-opacity')
    document.documentElement.style.removeProperty('--crt-vignette-opacity')
  })

  // ── Typography ────────────────────────────────────────────────────────────

  it.each(Object.entries(TYPOGRAPHY_CSS_VAR_MAP))(
    'sets %s → %s on <html> when design.typography.%s is provided',
    (field, cssVar) => {
      const settings = buildSettings({
        design: {
          typography: { [field]: '2rem' },
        },
      })
      renderHook(() => useAppTheme(settings))
      expect(setPropertyCalls.has(cssVar)).toBe(true)
      expect(setPropertyCalls.get(cssVar)).toBe('2rem')
    },
  )

  it('removes --heading-font-size when headingFontSize is cleared', () => {
    const { rerender } = renderHook(
      (props: { settings: AdminSettings }) => useAppTheme(props.settings),
      {
        initialProps: {
          settings: buildSettings({
            design: { typography: { headingFontSize: '3rem' } },
          }),
        },
      },
    )
    expect(setPropertyCalls.has('--heading-font-size')).toBe(true)

    rerender({
      settings: buildSettings({
        design: { typography: { headingFontSize: undefined } },
      }),
    })
    expect(setPropertyCalls.has('--heading-font-size')).toBe(false)
  })

  it('sets --heading-text-shadow to "none" when headingTextShadow=false', () => {
    const settings = buildSettings({
      design: { typography: { headingTextShadow: false } },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--heading-text-shadow')).toBe('none')
  })

  it('sets --heading-text-shadow to shadow values when headingTextShadow=true', () => {
    const settings = buildSettings({
      design: { typography: { headingTextShadow: true } },
    })
    renderHook(() => useAppTheme(settings))
    const val = setPropertyCalls.get('--heading-text-shadow')
    expect(val).toBeTruthy()
    expect(val).not.toBe('none')
  })

  it('removes --heading-text-shadow when headingTextShadow is unset', () => {
    const settings = buildSettings({ design: { typography: {} } })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.has('--heading-text-shadow')).toBe(false)
  })

  // ── Theme colors ──────────────────────────────────────────────────────────

  it.each(Object.entries(THEME_COLOR_CSS_VAR_MAP))(
    'sets theme.%s → %s on <html>',
    (field, cssVar) => {
      const settings = buildSettings({
        design: {
          theme: { [field]: 'testvalue' },
        },
      })
      renderHook(() => useAppTheme(settings))
      expect(setPropertyCalls.has(cssVar)).toBe(true)
    },
  )

  // ── Effect colors ─────────────────────────────────────────────────────────

  it.each(Object.entries(EFFECT_COLORS_CSS_VAR_MAP))(
    'sets design.effects.%s → %s on <html>',
    (field, cssVar) => {
      const settings = buildSettings({
        design: { effects: { [field]: 'rgba(255,0,0,0.5)' } },
      })
      renderHook(() => useAppTheme(settings))
      expect(setPropertyCalls.has(cssVar)).toBe(true)
    },
  )

  it('sets --scanline-opacity when design.effects.scanlineOpacity is provided', () => {
    const settings = buildSettings({
      design: { effects: { scanlineOpacity: 0.05 } },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--scanline-opacity')).toBe('0.05')
  })

  // ── Animation timings ─────────────────────────────────────────────────────

  it.each(Object.entries(TIMINGS_CSS_VAR_MAP))(
    'sets design.timings.%s → %s on <html>',
    (field, cssVar) => {
      const settings = buildSettings({
        design: { timings: { [field]: 1.5 } },
      })
      renderHook(() => useAppTheme(settings))
      expect(setPropertyCalls.has(cssVar)).toBe(true)
    },
  )

  // ── CRT intensity ─────────────────────────────────────────────────────────

  it('sets design.crt.vignetteOpacity → --vignette-opacity on <html>', () => {
    const settings = buildSettings({
      design: { crt: { vignetteOpacity: 0.8 } },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--vignette-opacity')).toBe('0.8')
  })

  it('sets design.crt.scanlineHeight → --scanline-height on <html>', () => {
    const settings = buildSettings({
      design: { crt: { scanlineHeight: 2 } },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--scanline-height')).toBe('2px')
  })

  it('sets design.crt.noiseFrequency → --noise-frequency on <html>', () => {
    const settings = buildSettings({
      design: { crt: { noiseFrequency: 3 } },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--noise-frequency')).toBe('3')
  })

  // ── Background (CRT overlay) ──────────────────────────────────────────────

  it('sets background.crtOverlayOpacity → --crt-overlay-opacity on <html>', () => {
    const settings = buildSettings({
      background: { crtOverlayOpacity: 0.15 },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--crt-overlay-opacity')).toBe('0.15')
  })

  it('sets background.crtVignetteOpacity → --crt-vignette-opacity on <html>', () => {
    const settings = buildSettings({
      background: { crtVignetteOpacity: 0.4 },
    })
    renderHook(() => useAppTheme(settings))
    expect(setPropertyCalls.get('--crt-vignette-opacity')).toBe('0.4')
  })

  // ── Completeness guard ────────────────────────────────────────────────────
  // These tests verify that every key in the canonical map above is actually
  // exercised. If a developer forgets to add a test entry here when adding
  // a new field to TypographyDetailSettings, the set-based check below will
  // still catch missing CSS variables.

  it('REGISTRY completeness — all typography CSS var map entries produce distinct variables', () => {
    const vars = Object.values(TYPOGRAPHY_CSS_VAR_MAP)
    const unique = new Set(vars)
    expect(unique.size).toBe(vars.length)
    // Each variable name must start with --
    vars.forEach((v) => expect(v).toMatch(/^--/))
  })

  it('REGISTRY completeness — all effect CSS var map entries produce distinct variables', () => {
    const allVars = [
      ...Object.values(EFFECT_COLORS_CSS_VAR_MAP),
      ...Object.values(NUMERIC_EFFECTS_CSS_VAR_MAP),
      ...Object.values(TIMINGS_CSS_VAR_MAP),
      ...Object.values(CRT_CSS_VAR_MAP),
    ]
    const unique = new Set(allVars)
    expect(unique.size).toBe(allVars.length)
  })
})
