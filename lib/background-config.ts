export type MobileVideoMode = 'same' | 'separate' | 'off'

export const DEFAULT_BACKGROUND_VIDEO_OPACITY = 0.5

export function parseMobileVideoMode(raw: unknown): MobileVideoMode {
  if (raw === 'separate' || raw === 'off') return raw
  return 'same'
}

/** Pick which background video URL to play for the current viewport. */
export function resolveActiveBackgroundVideoUrl(
  desktopUrl: string | undefined,
  mobileUrl: string | undefined,
  mobileMode: MobileVideoMode,
  isMobile: boolean,
): string | undefined {
  if (!desktopUrl && !mobileUrl) return undefined

  if (isMobile) {
    if (mobileMode === 'off') return undefined
    if (mobileMode === 'separate' && mobileUrl) return mobileUrl
  }

  return desktopUrl
}