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

/**
 * Output canvas size for crop export.
 *
 * @param viewport — editor UI crop window (often ≤420px)
 * @param maxOutputDimension — longest edge cap (e.g. 4096 for hero logos)
 * @param sourceScale — native image pixels per viewport pixel
 *   (`imageNaturalWidth / drawRect.width`). Use this so export is full-res
 *   from the source file, not the tiny UI preview. Default 1 keeps old behaviour.
 */
export function resolveOutputSize(
  viewport: CropViewport,
  maxOutputDimension: number,
  sourceScale = 1,
): CropViewport {
  const scale = Number.isFinite(sourceScale) && sourceScale > 0 ? sourceScale : 1
  let width = Math.max(1, Math.round(viewport.width * scale))
  let height = Math.max(1, Math.round(viewport.height * scale))
  const longest = Math.max(width, height)
  if (maxOutputDimension > 0 && longest > maxOutputDimension) {
    const factor = maxOutputDimension / longest
    width = Math.max(1, Math.round(width * factor))
    height = Math.max(1, Math.round(height * factor))
  }
  return { width, height }
}

/**
 * Native pixels per editor viewport pixel for the current draw rect.
 * Export at this scale so logos are not locked to the ~420px UI viewport.
 */
export function resolveSourceScale(
  imageNaturalWidth: number,
  drawRectWidth: number,
): number {
  if (imageNaturalWidth <= 0 || drawRectWidth <= 0) return 1
  return imageNaturalWidth / drawRectWidth
}

export function shouldOpenImageEditor(mimeType: string): boolean {
  return (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp'
  )
}