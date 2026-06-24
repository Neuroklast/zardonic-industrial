import sharp from 'sharp'
import {
  DEFAULT_MAX_IMAGE_HEIGHT,
  DEFAULT_MAX_IMAGE_WIDTH,
  JPEG_QUALITY,
  WEBP_QUALITY,
} from '@/lib/optimize-image-constants'

export {
  DEFAULT_MAX_IMAGE_HEIGHT,
  DEFAULT_MAX_IMAGE_WIDTH,
  JPEG_QUALITY,
  WEBP_QUALITY,
} from '@/lib/optimize-image-constants'

export type OptimizeImageFormat = 'webp' | 'jpeg' | 'png' | 'auto'

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  format?: OptimizeImageFormat
}

export interface OptimizedImageResult {
  buffer: Buffer
  contentType: string
  extension: string
}

const SKIP_MIME = new Set(['image/svg+xml', 'image/gif', 'image/x-icon'])

export function shouldSkipImageOptimization(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false
  return SKIP_MIME.has(mimeType.split(';')[0].trim().toLowerCase())
}

function extensionForContentType(contentType: string): string {
  switch (contentType.split(';')[0].trim().toLowerCase()) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    case 'image/x-icon':
      return 'ico'
    default:
      return 'jpg'
  }
}

export async function optimizeImageBuffer(
  input: Buffer,
  mimeHint?: string | null,
  options?: OptimizeImageOptions,
): Promise<OptimizedImageResult> {
  const normalizedMime = mimeHint?.split(';')[0].trim().toLowerCase()

  if (normalizedMime && shouldSkipImageOptimization(normalizedMime)) {
    return {
      buffer: input,
      contentType: normalizedMime,
      extension: extensionForContentType(normalizedMime),
    }
  }

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_IMAGE_HEIGHT
  const format = options?.format ?? 'auto'

  try {
    const image = sharp(input, { failOn: 'none' })
    const meta = await image.metadata()

    if (!meta.width || !meta.height) {
      const fallbackType = normalizedMime ?? 'application/octet-stream'
      return {
        buffer: input,
        contentType: fallbackType,
        extension: extensionForContentType(fallbackType),
      }
    }

    const pipeline = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    if (format === 'png') {
      const buffer = await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer()
      return { buffer, contentType: 'image/png', extension: 'png' }
    }

    if (format === 'jpeg') {
      const buffer = await pipeline
        .flatten({ background: '#000000' })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer()
      return { buffer, contentType: 'image/jpeg', extension: 'jpg' }
    }

    const buffer = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer()
    return { buffer, contentType: 'image/webp', extension: 'webp' }
  } catch {
    const fallbackType = normalizedMime ?? 'application/octet-stream'
    return {
      buffer: input,
      contentType: fallbackType,
      extension: extensionForContentType(fallbackType),
    }
  }
}