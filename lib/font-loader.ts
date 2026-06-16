/**
 * font-loader.ts
 *
 * Shared utilities for loading Google Fonts and extracting font names from
 * CSS font-stack strings. Used by use-app-theme.ts, AppearanceTab.tsx, and
 * ThemeCustomizerDialog.tsx.
 */

/** Track already-injected Google Fonts links so we don't duplicate them. */
const _loadedFonts = new Set<string>()

/** Extract the first font-family name from a CSS font stack string.
 *  E.g. "'Orbitron', sans-serif" → "Orbitron"
 *       "Rajdhani" → "Rajdhani"
 *       "system-ui" → null (system font, no remote load needed) */
export function extractGoogleFontName(fontValue: string): string | null {
  const systemFonts = new Set([
    'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif',
    'monospace', 'sans-serif', 'serif', 'cursive', 'fantasy',
    'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Courier New',
    'Georgia', 'Cambria', 'Times New Roman', 'Times', 'Arial',
    'Helvetica Neue', 'Helvetica',
  ])
  // Strip quotes and grab the first token
  const first = fontValue.replace(/['"]/g, '').split(',')[0].trim()
  if (!first || systemFonts.has(first)) return null
  return first
}

/** Dynamically inject a Google Fonts stylesheet if not already loaded. */
export function loadGoogleFont(fontName: string): void {
  if (_loadedFonts.has(fontName)) return
  _loadedFonts.add(fontName)
  const family = fontName.replace(/ /g, '+')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;700;900&display=swap`
  document.head.appendChild(link)
}
