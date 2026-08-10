import { SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES } from '@/lib/optimize-image-constants'

/** Prefer WebP (smaller + alpha). JPEG is never forced — server re-encodes. */
export function preferredExportMime(preserveAlpha: boolean): { type: string; quality: number } {
  // WebP keeps transparency for logos; slightly lower quality for opaque photos.
  if (preserveAlpha) return { type: 'image/webp', quality: 0.92 }
  return { type: 'image/webp', quality: 0.88 }
}

export function exportFileNameForMime(mimeType: string): string {
  if (mimeType === 'image/webp') return 'edited-image.webp'
  if (mimeType === 'image/jpeg') return 'edited-image.jpg'
  return 'edited-image.png'
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function scaleCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const scaled = document.createElement('canvas')
  scaled.width = Math.max(1, width)
  scaled.height = Math.max(1, height)
  const ctx = scaled.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, scaled.width, scaled.height)
  return scaled
}

/**
 * Encode a crop canvas for Server Action upload.
 * Prefers WebP (much smaller than full-res PNG). If still over maxBytes,
 * iteratively downscales + lowers quality until it fits.
 */
export async function encodeCanvasForUpload(
  source: HTMLCanvasElement,
  options?: {
    preserveAlpha?: boolean
    maxBytes?: number
  },
): Promise<Blob> {
  const preserveAlpha = options?.preserveAlpha ?? true
  const maxBytes = options?.maxBytes ?? SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES
  const preferred = preferredExportMime(preserveAlpha)

  let canvas = source
  let lastBlob: Blob | null = null

  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) {
      // Always scale from the original source so quality does not compound
      const factor = 0.75 ** attempt
      canvas = scaleCanvas(
        source,
        Math.max(1, Math.round(source.width * factor)),
        Math.max(1, Math.round(source.height * factor)),
      )
    }

    const quality = Math.max(0.55, preferred.quality - attempt * 0.08)
    let blob = await canvasToBlob(canvas, preferred.type, quality)
    if (!blob || blob.size === 0) {
      blob = await canvasToBlob(canvas, 'image/png')
    }
    if (!blob || blob.size === 0) {
      throw new Error('Failed to export image')
    }
    lastBlob = blob
    if (blob.size <= maxBytes) {
      return blob
    }
  }

  if (!lastBlob) {
    throw new Error('Failed to export image')
  }
  throw new Error(
    `Image is too large after export (${Math.ceil(lastBlob.size / (1024 * 1024))} MB). ` +
      `Max upload size is ${Math.floor(maxBytes / (1024 * 1024))} MB. Try a smaller source or crop tighter.`,
  )
}

/** Map Next/Vercel body-limit failures to a user-facing message. */
export function formatImageUploadError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Upload failed'

  if (
    /body exceeded/i.test(raw) ||
    /\b413\b/.test(raw) ||
    /payload too large/i.test(raw) ||
    /request entity too large/i.test(raw)
  ) {
    return (
      'Upload rejected: image is too large for the server. ' +
      'Use a smaller crop or source file. ' +
      raw.split('\n')[0]
    )
  }

  // Production often surfaces Server Action / RSC failures as React #441
  if (/minified react error #441/i.test(raw) || /an error occurred in the server components/i.test(raw)) {
    return (
      'Upload failed on the server (often a size limit). ' +
      'Try a smaller image or re-export, then try again.'
    )
  }

  return raw || 'Upload failed'
}
