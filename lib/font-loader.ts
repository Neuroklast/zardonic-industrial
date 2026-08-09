/**
 * font-loader.ts
 *
 * - Core defaults (Orbitron, Share Tech Mono, Space Mono) are self-hosted via next/font.
 * - Admin Appearance may pick additional Google Fonts; those are loaded on demand
 *   when the site operator configures them (not on cold load of unused fonts).
 */

/** Fonts bundled at build time with next/font (no network at runtime). */
export const SELF_HOSTED_FONT_NAMES = new Set([
  'Orbitron',
  'Share Tech Mono',
  'Space Mono',
])

/** Track already-injected Google Fonts stylesheet links. */
const _loadedFonts = new Set<string>()

/** Extract the first font-family name from a CSS font stack string. */
export function extractGoogleFontName(fontValue: string): string | null {
  const systemFonts = new Set([
    'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif',
    'monospace', 'sans-serif', 'serif', 'cursive', 'fantasy',
    'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Courier New',
    'Georgia', 'Cambria', 'Times New Roman', 'Times', 'Arial',
    'Helvetica Neue', 'Helvetica',
  ])
  // CSS vars like var(--font-orbitron) are not remote families
  if (fontValue.includes('var(')) {
    const quoted = fontValue.match(/['"]([A-Za-z0-9 ]+)['"]/)
    if (quoted) {
      const name = quoted[1].trim()
      if (systemFonts.has(name)) return null
      return name
    }
    return null
  }
  const first = fontValue.replace(/['"]/g, '').split(',')[0].trim()
  if (!first || systemFonts.has(first)) return null
  return first
}

/**
 * Load a Google Font stylesheet when the operator selects a non–self-hosted family.
 * Self-hosted names are skipped (already available via next/font).
 */
export function loadGoogleFont(fontName: string): void {
  if (typeof document === 'undefined') return
  if (!fontName || SELF_HOSTED_FONT_NAMES.has(fontName)) return
  if (_loadedFonts.has(fontName)) return
  _loadedFonts.add(fontName)

  const family = fontName.replace(/ /g, '+')
  const href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;900&display=swap`
  const safeAttr = fontName.replace(/["\\]/g, '')
  if (document.querySelector(`link[data-zd-font="${safeAttr}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-zd-font', safeAttr)
  document.head.appendChild(link)
}

/** True when stack needs no remote load (system or self-hosted only). */
export function isPrivacySafeFontStack(fontValue: string): boolean {
  const name = extractGoogleFontName(fontValue)
  if (!name) return true
  return SELF_HOSTED_FONT_NAMES.has(name)
}
