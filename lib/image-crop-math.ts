export interface CropViewport {
  width: number
  height: number
}

export interface CropState {
  /** Multiplier on top of base fit/cover scale (1 = default). */
  scale: number
  /** Pan offset from centered position, in viewport pixels. */
  offsetX: number
  offsetY: number
}

export type CropFitMode = 'cover' | 'contain'

export const DEFAULT_CROP_STATE: CropState = { scale: 1, offsetX: 0, offsetY: 0 }

export function computeBaseScale(
  imageWidth: number,
  imageHeight: number,
  viewport: CropViewport,
  mode: CropFitMode,
): number {
  if (imageWidth <= 0 || imageHeight <= 0) return 1
  if (mode === 'cover') {
    return Math.max(viewport.width / imageWidth, viewport.height / imageHeight)
  }
  return Math.min(viewport.width / imageWidth, viewport.height / imageHeight)
}

export function computeDrawRect(
  imageWidth: number,
  imageHeight: number,
  viewport: CropViewport,
  state: CropState,
  mode: CropFitMode,
): { x: number; y: number; width: number; height: number } {
  const base = computeBaseScale(imageWidth, imageHeight, viewport, mode)
  const scale = base * Math.max(state.scale, 0.1)
  const width = imageWidth * scale
  const height = imageHeight * scale
  const x = (viewport.width - width) / 2 + state.offsetX
  const y = (viewport.height - height) / 2 + state.offsetY
  return { x, y, width, height }
}

/** Clamp pan so the image still fills the viewport in cover mode. */
export function clampCropState(
  imageWidth: number,
  imageHeight: number,
  viewport: CropViewport,
  state: CropState,
  mode: CropFitMode,
): CropState {
  const scale = Math.max(state.scale, 0.1)
  const rect = computeDrawRect(imageWidth, imageHeight, viewport, { ...state, scale }, mode)

  let offsetX = state.offsetX
  let offsetY = state.offsetY

  if (mode === 'cover') {
    if (rect.width <= viewport.width) {
      offsetX = 0
    } else {
      const minX = viewport.width - rect.width
      const clampedX = Math.min(0, Math.max(minX, rect.x))
      offsetX += clampedX - rect.x
    }

    if (rect.height <= viewport.height) {
      offsetY = 0
    } else {
      const minY = viewport.height - rect.height
      const clampedY = Math.min(0, Math.max(minY, rect.y))
      offsetY += clampedY - rect.y
    }
  }

  return { scale, offsetX, offsetY }
}

/** Editor viewport size (px) for a given aspect ratio, capped for UI. */
export function resolveEditorViewport(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null,
  maxViewportSize = 420,
): CropViewport {
  const ratio =
    aspectRatio != null && aspectRatio > 0
      ? aspectRatio
      : imageWidth > 0 && imageHeight > 0
        ? imageWidth / imageHeight
        : 1

  if (ratio >= 1) {
    const width = maxViewportSize
    return { width, height: Math.round(width / ratio) }
  }
  const height = maxViewportSize
  return { width: Math.round(height * ratio), height }
}

/** Output canvas size preserving viewport aspect, capped by maxOutputDimension. */
export function resolveOutputSize(
  viewport: CropViewport,
  maxOutputDimension: number,
): CropViewport {
  const longest = Math.max(viewport.width, viewport.height)
  if (longest <= maxOutputDimension) {
    return { ...viewport }
  }
  const factor = maxOutputDimension / longest
  return {
    width: Math.round(viewport.width * factor),
    height: Math.round(viewport.height * factor),
  }
}

export function shouldOpenImageEditor(mimeType: string): boolean {
  return (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp'
  )
}