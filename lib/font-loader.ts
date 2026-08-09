/**
 * font-loader.ts
 *
 * Font name helpers for theme/appearance. Remote Google Fonts injection is
 * disabled for GDPR (DE case law on third-party font CDNs without consent).
 * Core site fonts are self-hosted via next/font in app/layout.tsx.
 */

/** Fonts bundled at build time with next/font (no network at runtime). */
export const SELF_HOSTED_FONT_NAMES = new Set([
  'Orbitron',
  'Share Tech Mono',
  'Space Mono',
])

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
  const first = fontValue.replace(/['"]/g, '').split(',')[0].trim()
  if (!first || systemFonts.has(first)) return null
  return first
}

/**
 * @deprecated No-op. Google Fonts CDN is not loaded at runtime (GDPR).
 * Self-hosted stacks only. Kept for call-site compatibility.
 */
export function loadGoogleFont(fontName: string): void {
  if (process.env.NODE_ENV === 'development' && fontName && !SELF_HOSTED_FONT_NAMES.has(fontName)) {
    console.info(
      `[fonts] Skipping remote load for "${fontName}" — use self-hosted / system stacks only (GDPR).`,
    )
  }
}

/** True when the stack only uses self-hosted or system fonts (no third-party CDN needed). */
export function isPrivacySafeFontStack(fontValue: string): boolean {
  const name = extractGoogleFontName(fontValue)
  if (!name) return true
  return SELF_HOSTED_FONT_NAMES.has(name)
}
