/**
 * Background animation styles available on the public homepage + admin Background tab.
 * Keep in sync with BackgroundStack AnimatedLayer and BackgroundConfigEditor.
 */
export const PUBLIC_BACKGROUND_TYPES = [
  'matrix',
  'circuit',
  'terminal',
  'data-stream',
  'glitch-grid',
  'stars',
  'minimal',
] as const

export type PublicBackgroundType = (typeof PUBLIC_BACKGROUND_TYPES)[number]

export const PUBLIC_BACKGROUND_TYPE_LABELS: Record<PublicBackgroundType, string> = {
  matrix: 'Matrix rain',
  circuit: 'Circuit board',
  terminal: 'Terminal shell',
  'data-stream': 'Data stream',
  'glitch-grid': 'Glitch grid',
  stars: 'Star field',
  minimal: 'None (image/video only)',
}

export function isPublicBackgroundType(value: unknown): value is PublicBackgroundType {
  return (
    typeof value === 'string' &&
    (PUBLIC_BACKGROUND_TYPES as readonly string[]).includes(value)
  )
}

export function parsePublicBackgroundType(
  value: unknown,
  fallback: PublicBackgroundType = 'matrix',
): PublicBackgroundType {
  return isPublicBackgroundType(value) ? value : fallback
}
