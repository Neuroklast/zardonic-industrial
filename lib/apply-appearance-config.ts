import { extractGoogleFontName, loadGoogleFont } from '@/lib/font-loader'
import { hexToOklch } from '@/lib/color-utils'
import type { AppearanceTheme } from '@/lib/appearance-presets'

export interface AppearanceConfigInput {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
  accentColor?: string
  accentColorSecondary?: string
  vignetteOpacity?: number
  chromaticStrength?: number
  faviconUrl?: string
  theme?: AppearanceTheme
}

function parseOklchComponents(oklchStr: string): { l: number; c: number; h: number } | null {
  const match = oklchStr.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) return null
  return { l: parseFloat(match[1]), c: parseFloat(match[2]), h: parseFloat(match[3]) }
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(value)
}

function toCssColor(value: string): string {
  return isHexColor(value) ? hexToOklch(value) : value
}

function setVar(root: HTMLElement, prop: string, value: string, applied: Record<string, string>) {
  root.style.setProperty(prop, value)
  applied[prop] = value
}

function applyThemeVars(root: HTMLElement, theme: AppearanceTheme, applied: Record<string, string>) {
  const mappings: Array<[keyof AppearanceTheme, string]> = [
    ['primaryColor', '--primary'],
    ['accentColor', '--accent'],
    ['backgroundColor', '--background'],
    ['cardColor', '--card'],
    ['foregroundColor', '--foreground'],
    ['mutedForegroundColor', '--muted-foreground'],
    ['borderColor', '--border'],
    ['secondaryColor', '--secondary'],
    ['fontHeading', '--font-heading'],
    ['fontBody', '--font-body'],
    ['fontMono', '--font-mono'],
    ['headingFontSize', '--heading-font-size'],
    ['bodyFontSize', '--body-font-size'],
    ['monoFontSize', '--mono-font-size'],
  ]

  for (const [key, cssVar] of mappings) {
    const raw = theme[key]
    if (!raw) continue
    const value = key.endsWith('Color') ? toCssColor(raw) : raw
    setVar(root, cssVar, value, applied)

    if (key === 'accentColor') {
      setVar(root, '--hover-color', value, applied)
      const comps = parseOklchComponents(value)
      if (comps) {
        setVar(root, '--accent-l', String(comps.l), applied)
        setVar(root, '--accent-c', String(comps.c), applied)
        setVar(root, '--accent-h', String(comps.h), applied)
      }
    }

    if (key === 'fontHeading' || key === 'fontBody' || key === 'fontMono') {
      const fontName = extractGoogleFontName(value)
      if (fontName) loadGoogleFont(fontName)
    }
  }
}

/** Apply appearance config to document root CSS variables. Returns map of applied vars. */
export function applyAppearanceConfig(
  config: AppearanceConfigInput,
  root: HTMLElement = document.documentElement,
): Record<string, string> {
  const applied: Record<string, string> = {}

  if (config.theme) {
    applyThemeVars(root, config.theme, applied)
  }

  if (config.accentColor) {
    const accent = toCssColor(config.accentColor)
    setVar(root, '--accent', accent, applied)
  }

  if (config.accentColorSecondary) {
    setVar(root, '--accent-secondary', toCssColor(config.accentColorSecondary), applied)
  }

  if (typeof config.vignetteOpacity === 'number') {
    setVar(root, '--vignette-opacity', String(config.vignetteOpacity), applied)
  }

  if (typeof config.chromaticStrength === 'number') {
    setVar(root, '--chromatic-strength', String(config.chromaticStrength), applied)
  }

  if (config.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = config.faviconUrl
  }

  return applied
}