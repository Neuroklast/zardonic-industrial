/**
 * Public font resolution — fonts are NEVER hard-locked in CSS/components.
 * Admin Appearance (site_config.appearance.theme) is the source of truth.
 * System stacks are the only CSS fallbacks until theme applies.
 */

import type { AppearanceTheme } from '@/lib/appearance-presets'
import { extractGoogleFontName, loadGoogleFont, SELF_HOSTED_FONT_NAMES } from '@/lib/font-loader'

/** Generic fallbacks only — no brand faces (Orbitron etc.) unless admin chooses them. */
export const SYSTEM_FONT_HEADING = 'system-ui, ui-sans-serif, sans-serif'
export const SYSTEM_FONT_BODY = 'system-ui, ui-sans-serif, sans-serif'
export const SYSTEM_FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

export interface ResolvedPublicFonts {
  fontHeading: string
  fontBody: string
  fontMono: string
}

export function resolvePublicFonts(theme?: AppearanceTheme | null): ResolvedPublicFonts {
  const t = theme && typeof theme === 'object' ? theme : {}
  return {
    fontHeading: (typeof t.fontHeading === 'string' && t.fontHeading.trim()) || SYSTEM_FONT_HEADING,
    fontBody: (typeof t.fontBody === 'string' && t.fontBody.trim()) || SYSTEM_FONT_BODY,
    fontMono: (typeof t.fontMono === 'string' && t.fontMono.trim()) || SYSTEM_FONT_MONO,
  }
}

/** CSS text for :root — safe for SSR <style> inject. */
export function buildPublicFontCssVars(fonts: ResolvedPublicFonts): string {
  // Escape characters that could break out of the `:root{...}` declaration or
  // the surrounding <style> element (CSS-injection defense for admin-supplied
  // font names — matches the pattern used by the CSP-note accepted style-src).
  const esc = (s: string) =>
    s
      .replace(/\\/g, '\\5c ')
      .replace(/</g, '\\3c ')
      .replace(/>/g, '\\3e ')
      .replace(/\{/g, '\\7b ')
      .replace(/\}/g, '\\7d ')
      .replace(/;/g, '\\3b ')
      .replace(/\r?\n/g, '')
  return `:root{--font-heading:${esc(fonts.fontHeading)};--font-body:${esc(fonts.fontBody)};--font-mono:${esc(fonts.fontMono)};}`
}

/** Google Font family names that need a runtime stylesheet (not next/font self-hosted). */
export function remoteFontFamiliesToLoad(fonts: ResolvedPublicFonts): string[] {
  const names = new Set<string>()
  for (const stack of [fonts.fontHeading, fonts.fontBody, fonts.fontMono]) {
    const name = extractGoogleFontName(stack)
    if (name && !SELF_HOSTED_FONT_NAMES.has(name)) names.add(name)
  }
  return [...names]
}

export function googleFontsStylesheetHref(familyName: string): string {
  const family = familyName.replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;900&display=swap`
}

/** Client: ensure remote faces for current stacks are loaded. */
export function ensureRemoteFontsLoaded(fonts: ResolvedPublicFonts): void {
  for (const name of remoteFontFamiliesToLoad(fonts)) {
    loadGoogleFont(name)
  }
}
