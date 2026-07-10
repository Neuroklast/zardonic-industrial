/**
 * Precomputed hex fallbacks for inline styles and var() defaults where PostCSS cannot run.
 * Values match the project's default crimson / cyan accent palette.
 */
export const PRIMARY_CRIMSON_FALLBACK = '#b52b2b'
export const ACCENT_CYAN_FALLBACK = '#33b8cc'
export const ACCENT_MAGENTA_FALLBACK = '#334dcc'
export const ACCENT_ORANGE_FALLBACK = '#e65c33'
export const NEUTRAL_MID_FALLBACK = '#999999'
export const NEUTRAL_LIGHT_FALLBACK = '#d9d9d9'
export const HOLO_CYAN_FALLBACK = '#33ccd9'

/** Default DIGICIDE accent #6399a6 as RGB components for rgba(var(--accent-r), …) fallbacks. */
export const DEFAULT_ACCENT_RGB = { r: '99', g: '153', b: '166' } as const