import { uploadOptimizedImage } from '@/app/admin/_actions/uploadOptimizedImage'
import { exportFileNameForMime, formatImageUploadError } from '@/lib/image-crop-export'
import {
  DEFAULT_MAX_IMAGE_HEIGHT,
  DEFAULT_MAX_IMAGE_WIDTH,
  SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES,
} from '@/lib/optimize-image-constants'

export async function submitOptimizedUpload(
  blob: Blob,
  storagePrefix: string,
  options?: { maxWidth?: number; maxHeight?: number; fileName?: string },
): Promise<{ storagePath: string; publicUrl: string }> {
  if (blob.size > SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error(
      `Image is too large to upload (${Math.ceil(blob.size / (1024 * 1024))} MB). ` +
        `Max is ${Math.floor(SERVER_ACTION_IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024))} MB after crop/export.`,
    )
  }

  const formData = new FormData()
  const mime = blob.type || 'image/webp'
  const fileName = options?.fileName ?? exportFileNameForMime(mime)
  formData.set('file', new File([blob], fileName, { type: mime }))
  formData.set('prefix', storagePrefix)
  formData.set('maxWidth', String(options?.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH))
  formData.set('maxHeight', String(options?.maxHeight ?? DEFAULT_MAX_IMAGE_HEIGHT))

  try {
    const result = await uploadOptimizedImage(formData)
    if (!result.ok || !result.storagePath) {
      throw new Error(result.error ?? 'Upload failed')
    }
    return {
      storagePath: result.storagePath,
      publicUrl: result.publicUrl ?? '',
    }
  } catch (error) {
    throw new Error(formatImageUploadError(error))
  }
}