/**
 * Shared color conversion utilities.
 *
 * Provides accurate oklch ↔ hex conversion (Björn Ottosson OKLab pipeline)
 * plus browser-based CSS color resolution for arbitrary formats.
 */

import { cssColorToRgb } from './contrast'

/** Whether the current runtime can parse and render oklch() color values. */
export function supportsOklch(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    // SSR, tests, and theme-restore before CSS is ready: keep oklch; stylesheet fallbacks cover legacy browsers.
    return true
  }
  return CSS.supports('color', 'oklch(0 0 0)')
}

/**
 * Pick oklch for modern browsers, hex for legacy browsers without oklch support.
 */
export function resolveCssColorValue(color: string): string {
  if (supportsOklch() || !color.includes('oklch(')) {
    return color
  }
  return oklchToHex(color)
}

/** Split a CSS color into comma-separated RGB components for rgba(var(--accent-r), …) fallbacks. */
export function cssColorToRgbComponents(color: string): { r: string; g: string; b: string } | null {
  const rgb = parseCssColorToRgb(color)
  if (!rgb) return null
  return { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) }
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${clampByte(r).toString(16).padStart(2, '0')}${clampByte(g).toString(16).padStart(2, '0')}${clampByte(b).toString(16).padStart(2, '0')}`
}

/** Parse #rgb / #rrggbb / #rrggbbaa into 0–255 channels. */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim()
  const m = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

function srgbChannelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function linearToSrgbChannel(c: number): number {
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return s * 255
}

/** sRGB 0–255 → OKLab (Björn Ottosson). */
function srgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const lr = srgbChannelToLinear(r)
  const lg = srgbChannelToLinear(g)
  const lb = srgbChannelToLinear(b)

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  }
}

function oklabToOklch(lab: { L: number; a: number; b: number }): { L: number; C: number; H: number } {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (H < 0) H += 360
  return { L: lab.L, C, H }
}

function oklchToOklab(L: number, C: number, H: number): { L: number; a: number; b: number } {
  const hr = (H * Math.PI) / 180
  return {
    L,
    a: C * Math.cos(hr),
    b: C * Math.sin(hr),
  }
}

/** OKLab → sRGB 0–255. */
function oklabToSrgb(lab: { L: number; a: number; b: number }): { r: number; g: number; b: number } {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return {
    r: linearToSrgbChannel(r),
    g: linearToSrgbChannel(g),
    b: linearToSrgbChannel(b),
  }
}

function parseOklchComponents(value: string): { L: number; C: number; H: number } | null {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) return null
  return { L: parseFloat(match[1]), C: parseFloat(match[2]), H: parseFloat(match[3]) }
}

/** Resolve any CSS color to RGB via pure hex parse, OKLCH math, or browser canvas. */
function parseCssColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = parseHexColor(color)
  if (hex) return hex

  const oklch = parseOklchComponents(color)
  if (oklch) {
    return oklabToSrgb(oklchToOklab(oklch.L, oklch.C, oklch.H))
  }

  return cssColorToRgb(color)
}

/**
 * Convert any CSS color value (oklch, hsl, rgb, named, …) to a hex string.
 * Falls back to `#ff3333` when the color cannot be resolved.
 */
export function oklchToHex(oklch: string): string {
  const rgb = parseCssColorToRgb(oklch)
  if (rgb) {
    return rgbToHex(rgb.r, rgb.g, rgb.b)
  }
  return '#ff3333'
}

/**
 * Ensure a given foreground color is readable against a given background color.
 * Works by parsing the lightness `L` value of `oklch(L C H)` strings.
 * If the color cannot be parsed as OKLCH, returns the original color.
 */
export function ensureContrast(fgOklch: string, bgOklch: string): string {
  const fgMatch = fgOklch.match(/oklch\(\s*([\d.]+)/)
  const bgMatch = bgOklch.match(/oklch\(\s*([\d.]+)/)

  if (fgMatch && bgMatch) {
    const fgL = parseFloat(fgMatch[1])
    const bgL = parseFloat(bgMatch[1])

    if (bgL > 0.6) {
      if (fgL > 0.5) {
        return 'oklch(0.15 0 0)'
      }
    } else {
      if (fgL < 0.5) {
        return 'oklch(0.95 0 0)'
      }
    }
  }

  return fgOklch
}

/** Convert a hex color to an rgba() string with the given alpha (0–1). */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseCssColorToRgb(hex)
  if (!rgb) return `rgba(0, 0, 1, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/** Append an alpha channel to an oklch() color string. */
export function oklchWithAlpha(oklch: string, alpha: number): string {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) return `oklch(0.045 0.008 230 / ${alpha})`
  return `oklch(${match[1]} ${match[2]} ${match[3]} / ${alpha})`
}

/**
 * Convert a hex color to an accurate oklch() string (OKLab pipeline).
 * Falls back to `oklch(0.50 0.22 25)` when the color cannot be resolved.
 */
export function hexToOklch(hex: string): string {
  const rgb = parseHexColor(hex) ?? cssColorToRgb(hex)
  if (!rgb) return 'oklch(0.50 0.22 25)'

  const { L, C, H } = oklabToOklch(srgbToOklab(rgb.r, rgb.g, rgb.b))
  // Stable precision for CSS vars and round-trip with oklchToHex
  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)})`
}
