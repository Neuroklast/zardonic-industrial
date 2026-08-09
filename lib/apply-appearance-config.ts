import { extractGoogleFontName, loadGoogleFont } from '@/lib/font-loader'
import {
  cssColorToRgbComponents,
  hexToOklch,
  hexToRgba,
  oklchToHex,
  oklchWithAlpha,
  resolveCssColorValue,
} from '@/lib/color-utils'
import type { AppearanceTheme } from '@/lib/appearance-presets'

export interface AppearanceConfigInput {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
  /** Film grain intensity 0–1 when noise is enabled. */
  noiseIntensity?: number
  /** Use denser film-grain pattern. */
  filmGrain?: boolean
  accentColor?: string
  accentColorSecondary?: string
  vignetteOpacity?: number
  chromaticStrength?: number
  sectionPanelOpacity?: number
  /** Accent grid lines on section panels (0 = off). */
  sectionGridOpacity?: number
  cardSurfaceOpacity?: number
  faviconUrl?: string
  theme?: AppearanceTheme
}

const DEFAULT_CARD_COLOR = 'oklch(0.045 0.008 230)'
export const DEFAULT_SECTION_PANEL_OPACITY = 0.55
export const DEFAULT_SECTION_GRID_OPACITY = 0
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

function setColorVar(
  root: HTMLElement,
  prop: string,
  color: string,
  applied: Record<string, string>,
) {
  const resolved = resolveCssColorValue(color)
  setVar(root, prop, resolved, applied)
}

function setAccentRgbVars(
  root: HTMLElement,
  accentColor: string,
  applied: Record<string, string>,
) {
  const components = cssColorToRgbComponents(accentColor)
  if (!components) return
  setVar(root, '--accent-r', components.r, applied)
  setVar(root, '--accent-g', components.g, applied)
  setVar(root, '--accent-b', components.b, applied)
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
  setVar(
    root,
    '--surface-section-bg',
    resolveCssColorValue(oklchWithAlpha(cardColor, sectionPanelOpacity)),
    applied,
  )
  setVar(root, '--surface-card-bg-fallback', hexToRgba(cardHex, cardSurfaceOpacity), applied)
  setVar(
    root,
    '--surface-card-bg',
    resolveCssColorValue(oklchWithAlpha(cardColor, cardSurfaceOpacity)),
    applied,
  )
  setVar(
    root,
    '--surface-section-backdrop',
    sectionPanelOpacity > 0 ? 'blur(4px)' : 'none',
    applied,
  )

  const borderOpacity =
    sectionPanelOpacity <= 0
      ? 0
      : Math.min(sectionPanelOpacity * (0.6 / DEFAULT_SECTION_PANEL_OPACITY), 1)
  setVar(root, '--surface-section-border-opacity', String(borderOpacity), applied)
}

const FOREGROUND_ALIAS_VARS = [
  '--card-foreground',
  '--popover-foreground',
  '--primary-foreground',
  '--secondary-foreground',
  '--accent-foreground',
  '--destructive-foreground',
] as const

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
    ['modalGlowColor', '--modal-glow'],
    ['fontHeading', '--font-heading'],
    ['fontBody', '--font-body'],
    ['fontMono', '--font-mono'],
  ]

  for (const [key, cssVar] of mappings) {
    const raw = theme[key]
    if (!raw) continue
    const value = key.endsWith('Color') ? toCssColor(raw) : raw
    if (key.endsWith('Color')) {
      setColorVar(root, cssVar, value, applied)
    } else {
      setVar(root, cssVar, value, applied)
    }

    if (key === 'foregroundColor') {
      for (const alias of FOREGROUND_ALIAS_VARS) {
        setColorVar(root, alias, value, applied)
      }
    }

    if (key === 'accentColor') {
      setColorVar(root, '--hover-color', value, applied)
      setAccentRgbVars(root, value, applied)
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

  if (theme.headingFontSize) {
    setVar(root, '--font-size-heading', theme.headingFontSize, applied)
  }

  if (theme.bodyFontSize) {
    setVar(root, '--font-size-body', theme.bodyFontSize, applied)
    setVar(root, '--body-font-size', theme.bodyFontSize, applied)
  }

  if (theme.monoFontSize) {
    setVar(root, '--mono-font-size', theme.monoFontSize, applied)
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
    setColorVar(root, '--accent', accent, applied)
    setAccentRgbVars(root, accent, applied)
  }

  if (config.accentColorSecondary) {
    setColorVar(root, '--accent-secondary', toCssColor(config.accentColorSecondary), applied)
  }

  if (typeof config.vignetteOpacity === 'number') {
    const vignette = String(config.vignetteOpacity)
    setVar(root, '--vignette-opacity', vignette, applied)
    setVar(root, '--crt-vignette-opacity', vignette, applied)
  }

  if (typeof config.chromaticStrength === 'number') {
    const strength = Math.min(1, Math.max(0, config.chromaticStrength))
    setVar(root, '--chromatic-strength', String(strength), applied)
    // Full-page fringe scale (0–10); used by .global-chromatic-overlay
    setVar(root, '--global-chromatic', String(strength * 10), applied)
  }

  if (typeof config.noiseIntensity === 'number') {
    setVar(root, '--noise-opacity', String(config.noiseIntensity), applied)
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

  const sectionGridOpacity =
    typeof config.sectionGridOpacity === 'number'
      ? config.sectionGridOpacity
      : sectionPanelOpacity > 0
        ? DEFAULT_SECTION_GRID_OPACITY
        : 0
  setVar(root, '--section-grid-opacity', String(sectionGridOpacity), applied)

  if (config.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = config.faviconUrl
  }

  applyGlobalEffectsVisibility(config)

  // Persist for FOUC-free restore on next load (public site after Save)
  if (typeof window !== 'undefined' && Object.keys(applied).length > 0) {
    try {
      const existing = localStorage.getItem('nk-theme-cache')
      const prev = existing ? (JSON.parse(existing) as Record<string, string>) : {}
      localStorage.setItem('nk-theme-cache', JSON.stringify({ ...prev, ...applied }))
    } catch {
      // private mode / quota — ignore
    }
  }

  return applied
}

function setElementDisplay(selector: string, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.style.display = visible ? '' : 'none'
  })
}

/** Toggle CRT / scanline / noise layers in the live-preview iframe. */
export function applyGlobalEffectsVisibility(config: AppearanceConfigInput): void {
  if (typeof document === 'undefined') return

  if (typeof config.crtEnabled === 'boolean') {
    setElementDisplay('.crt-overlay, .crt-vignette', config.crtEnabled)
  }
  if (typeof config.scanlineEnabled === 'boolean') {
    setElementDisplay('.crt-scanline-bg', config.scanlineEnabled)
  }
  if (typeof config.noiseEnabled === 'boolean') {
    setElementDisplay('.full-page-noise', config.noiseEnabled)
  }
  if (typeof config.noiseIntensity === 'number') {
    document.documentElement.style.setProperty('--noise-opacity', String(config.noiseIntensity))
  }
  document.querySelectorAll<HTMLElement>('.full-page-noise').forEach((el) => {
    if (typeof config.filmGrain === 'boolean') {
      el.classList.toggle('film-grain', config.filmGrain)
    }
    if (typeof config.noiseIntensity === 'number') {
      el.style.setProperty('--noise-opacity', String(config.noiseIntensity))
    }
  })

  // Live chromatic slider: update root vars + show/hide global overlay in preview
  if (typeof config.chromaticStrength === 'number') {
    const strength = Math.min(1, Math.max(0, config.chromaticStrength))
    const docRoot = document.documentElement
    docRoot.style.setProperty('--chromatic-strength', String(strength))
    docRoot.style.setProperty('--global-chromatic', String(strength * 10))
    let layer = document.querySelector<HTMLElement>('[data-draft-target="global-chromatic"]')
    if (strength > 0.01) {
      if (!layer) {
        layer = document.createElement('div')
        layer.className = 'global-chromatic-overlay'
        layer.setAttribute('data-draft-target', 'global-chromatic')
        layer.setAttribute('aria-hidden', 'true')
        document.body.appendChild(layer)
      }
      layer.style.setProperty('--global-chromatic', String(strength * 10))
      layer.style.display = ''
    } else if (layer) {
      layer.style.display = 'none'
    }
  }
}