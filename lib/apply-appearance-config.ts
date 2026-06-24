import { extractGoogleFontName, loadGoogleFont } from '@/lib/font-loader'
import { hexToOklch, hexToRgba, oklchToHex, oklchWithAlpha } from '@/lib/color-utils'
import type { AppearanceTheme } from '@/lib/appearance-presets'

export interface AppearanceConfigInput {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
  accentColor?: string
  accentColorSecondary?: string
  vignetteOpacity?: number
  chromaticStrength?: number
  sectionPanelOpacity?: number
  cardSurfaceOpacity?: number
  faviconUrl?: string
  theme?: AppearanceTheme
}

const DEFAULT_CARD_COLOR = 'oklch(0.045 0.008 230)'
export const DEFAULT_SECTION_PANEL_OPACITY = 0.55
export const DEFAULT_CARD_SURFACE_OPACITY = 0.85

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

function applySurfaceVars(
  root: HTMLElement,
  theme: AppearanceTheme | undefined,
  sectionPanelOpacity: number,
  cardSurfaceOpacity: number,
  applied: Record<string, string>,
) {
  const cardColorRaw = theme?.cardColor ?? DEFAULT_CARD_COLOR
  const cardColor = toCssColor(cardColorRaw)
  const cardHex = isHexColor(cardColorRaw) ? cardColorRaw : oklchToHex(cardColor)

  setVar(root, '--surface-section-bg-fallback', hexToRgba(cardHex, sectionPanelOpacity), applied)
  setVar(root, '--surface-section-bg', oklchWithAlpha(cardColor, sectionPanelOpacity), applied)
  setVar(root, '--surface-card-bg-fallback', hexToRgba(cardHex, cardSurfaceOpacity), applied)
  setVar(root, '--surface-card-bg', oklchWithAlpha(cardColor, cardSurfaceOpacity), applied)
  setVar(
    root,
    '--surface-section-backdrop',
    sectionPanelOpacity > 0 ? 'blur(4px)' : 'none',
    applied,
  )
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
    const vignette = String(config.vignetteOpacity)
    setVar(root, '--vignette-opacity', vignette, applied)
    setVar(root, '--crt-vignette-opacity', vignette, applied)
  }

  if (typeof config.chromaticStrength === 'number') {
    setVar(root, '--chromatic-strength', String(config.chromaticStrength), applied)
  }

  const sectionPanelOpacity =
    typeof config.sectionPanelOpacity === 'number'
      ? config.sectionPanelOpacity
      : DEFAULT_SECTION_PANEL_OPACITY
  const cardSurfaceOpacity =
    typeof config.cardSurfaceOpacity === 'number'
      ? config.cardSurfaceOpacity
      : DEFAULT_CARD_SURFACE_OPACITY

  applySurfaceVars(root, config.theme, sectionPanelOpacity, cardSurfaceOpacity, applied)

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