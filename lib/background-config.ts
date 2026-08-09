export type MobileVideoMode = 'same' | 'separate' | 'off'

export const DEFAULT_BACKGROUND_VIDEO_OPACITY = 0.5

export function parseMobileVideoMode(raw: unknown): MobileVideoMode {
  if (raw === 'separate' || raw === 'off') return raw
  return 'same'
}

/**
 * Explicit master switch for background video.
 * When key is missing: enabled if a video URL/path is configured (back-compat).
 */
export function parseBackgroundVideoEnabled(
  raw: unknown,
  hasConfiguredVideo: boolean,
): boolean {
  if (typeof raw === 'boolean') return raw
  return hasConfiguredVideo
}

/** Pick which background video URL to play for the current viewport. */
export function resolveActiveBackgroundVideoUrl(
  desktopUrl: string | undefined,
  mobileUrl: string | undefined,
  mobileMode: MobileVideoMode,
  isMobile: boolean,
  videoEnabled = true,
): string | undefined {
  if (!videoEnabled) return undefined
  if (!desktopUrl && !mobileUrl) return undefined

  if (isMobile) {
    if (mobileMode === 'off') return undefined
    if (mobileMode === 'separate' && mobileUrl) return mobileUrl
  }

  return desktopUrl
}