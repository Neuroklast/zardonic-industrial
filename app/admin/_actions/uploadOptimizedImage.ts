'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { uploadBufferToR2 } from '@/app/admin/_actions/r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import {
  DEFAULT_MAX_IMAGE_HEIGHT,
  DEFAULT_MAX_IMAGE_WIDTH,
  optimizeImageBuffer,
} from '@/lib/optimize-image'
import { REMOTE_IMAGE_MAX_BYTES } from '@/lib/remote-image-url'

export interface UploadOptimizedImageResult {
  ok: boolean
  storagePath?: string
  publicUrl?: string
  error?: string
}

function sanitizePrefix(prefix: string): string {
  return prefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
}

export async function uploadOptimizedImage(formData: FormData): Promise<UploadOptimizedImageResult> {
  const result = await runAdminAction(async () => {
    const file = formData.get('file')
    if (!(file instanceof Blob) || file.size === 0) {
      return { ok: false as const, error: 'No image file provided' }
    }

    if (file.size > REMOTE_IMAGE_MAX_BYTES) {
      return {
        ok: false as const,
        error: `File too large (max ${REMOTE_IMAGE_MAX_BYTES / (1024 * 1024)} MB)`,
      }
    }

    const prefix = sanitizePrefix(String(formData.get('prefix') ?? 'uploads'))
    const maxWidth = Number(formData.get('maxWidth')) || DEFAULT_MAX_IMAGE_WIDTH
    const maxHeight = Number(formData.get('maxHeight')) || DEFAULT_MAX_IMAGE_HEIGHT
    const mimeType = file.type || 'image/jpeg'

    const buffer = Buffer.from(await file.arrayBuffer())
    const optimized = await optimizeImageBuffer(buffer, mimeType, { maxWidth, maxHeight })

    const objectPath = `${prefix}/${Date.now()}.${optimized.extension}`
    const { publicUrl, objectPath: storedPath } = await uploadBufferToR2(
      MEDIA_BUCKET,
      objectPath,
      optimized.buffer,
      optimized.contentType,
    )

    return {
      ok: true as const,
      storagePath: storedPath,
      publicUrl,
    }
  }, 'Unable to upload image.')

  if ('error' in result && !('ok' in result)) {
    return { ok: false, error: result.error }
  }
  return result
}