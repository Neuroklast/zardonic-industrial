import { uploadOptimizedImage } from '@/app/admin/_actions/uploadOptimizedImage'
import { DEFAULT_MAX_IMAGE_HEIGHT, DEFAULT_MAX_IMAGE_WIDTH } from '@/lib/optimize-image-constants'

export async function submitOptimizedUpload(
  blob: Blob,
  storagePrefix: string,
  options?: { maxWidth?: number; maxHeight?: number; fileName?: string },
): Promise<{ storagePath: string; publicUrl: string }> {
  const formData = new FormData()
  const fileName = options?.fileName ?? 'edited-image.png'
  formData.set('file', new File([blob], fileName, { type: blob.type || 'image/png' }))
  formData.set('prefix', storagePrefix)
  formData.set('maxWidth', String(options?.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH))
  formData.set('maxHeight', String(options?.maxHeight ?? DEFAULT_MAX_IMAGE_HEIGHT))

  const result = await uploadOptimizedImage(formData)
  if (!result.ok || !result.storagePath) {
    throw new Error(result.error ?? 'Upload failed')
  }
  return {
    storagePath: result.storagePath,
    publicUrl: result.publicUrl ?? '',
  }
}