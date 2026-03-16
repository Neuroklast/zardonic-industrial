/**
 * Theme Package Validator
 * Runtime validation for theme configuration objects.
 */

import type { ThemeSettings } from './types'

export interface ThemeValidationError {
  field: string
  severity: 'error' | 'warning'
  message: string
}

const VALID_HERO_VARIANTS = new Set(['glitch-parallax', 'chromatic-hover', 'minimal', 'default'])
const VALID_LOADING_SCREENS = new Set(['3d-model', 'code-rain', 'cyberpunk', 'minimal'])

export function validateThemeSettings(theme: ThemeSettings): ThemeValidationError[] {
  const errors: ThemeValidationError[] = []

  const warn = (field: string, message: string) =>
    errors.push({ field, severity: 'warning', message })

  if (theme.heroStyle && !VALID_HERO_VARIANTS.has(theme.heroStyle)) {
    warn('heroStyle', `heroStyle "${theme.heroStyle}" is not a recognised value`)
  }

  if (theme.loadingScreenType && !VALID_LOADING_SCREENS.has(theme.loadingScreenType)) {
    warn('loadingScreenType', `loadingScreenType "${theme.loadingScreenType}" is not a recognised value`)
  }

  if (theme.overlayEffects) {
    const effects = ['scanlines', 'crt', 'noise', 'vignette', 'chromatic', 'dotMatrix'] as const
    for (const effect of effects) {
      const cfg = theme.overlayEffects[effect]
      if (cfg?.intensity !== undefined && (cfg.intensity < 0 || cfg.intensity > 1)) {
        warn(`overlayEffects.${effect}.intensity`, `Intensity must be between 0 and 1`)
      }
    }
  }

  return errors
}

export function isThemeValid(theme: ThemeSettings): boolean {
  const results = validateThemeSettings(theme)
  return results.filter(e => e.severity === 'error').length === 0
}
