'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageCropEditor } from '@/app/admin/_components/ImageCropEditor'
import { submitOptimizedUpload } from '@/app/admin/_lib/submitOptimizedUpload'
import { shouldOpenImageEditor, type CropFitMode } from '@/lib/image-crop-math'
import { REMOTE_IMAGE_MAX_BYTES } from '@/lib/remote-image-url'

const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
])

interface ImageUploaderProps {
  label?: string
  currentUrl?: string | null
  storagePrefix?: string
  onUpload: (storagePath: string, publicUrl?: string) => void
  onError?: (error: string) => void
  accept?: string
  enableEditor?: boolean
  editorAspectRatio?: number | null
  editorFitMode?: CropFitMode
  maxOutputDimension?: number
}

export function ImageUploader({
  label = 'Upload Image',
  currentUrl,
  storagePrefix = 'uploads',
  onUpload,
  onError,
  accept = 'image/*',
  enableEditor = true,
  editorAspectRatio = null,
  editorFitMode = 'cover',
  maxOutputDimension = 2400,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)
  const [pendingObjectUrl, setPendingObjectUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentUrl ?? null)
  }, [currentUrl])

  useEffect(() => {
    return () => {
      if (pendingObjectUrl) URL.revokeObjectURL(pendingObjectUrl)
    }
  }, [pendingObjectUrl])

  async function uploadBlob(blob: Blob) {
    setUploading(true)
    try {
      const { storagePath, publicUrl } = await submitOptimizedUpload(blob, storagePrefix)
      setPreview(publicUrl || URL.createObjectURL(blob))
      onUpload(storagePath, publicUrl || undefined)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      onError?.(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditorSrc(null)
    if (pendingObjectUrl) {
      URL.revokeObjectURL(pendingObjectUrl)
      setPendingObjectUrl(null)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > REMOTE_IMAGE_MAX_BYTES) {
      const msg = `File too large (max ${REMOTE_IMAGE_MAX_BYTES / (1024 * 1024)} MB)`
      onError?.(msg)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (!ALLOWED_UPLOAD_MIME.has(file.type)) {
      onError?.('Unsupported file type. Use JPEG, PNG, WebP, GIF, SVG, or ICO.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (enableEditor && shouldOpenImageEditor(file.type)) {
      const objectUrl = URL.createObjectURL(file)
      setPendingObjectUrl(objectUrl)
      setEditorSrc(objectUrl)
      setEditorOpen(true)
      return
    }

    await uploadBlob(file)
  }

  return (
    <div className="space-y-2">
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-32 h-32 object-cover rounded border border-zinc-700"
        />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || editorOpen}
        className="px-3 py-1.5 text-sm rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => void handleFileChange(e)}
        className="hidden"
      />

      {editorSrc && (
        <ImageCropEditor
          open={editorOpen}
          imageSrc={editorSrc}
          title="Adjust & crop image"
          aspectRatio={editorAspectRatio}
          fitMode={editorFitMode}
          maxOutputDimension={maxOutputDimension}
          onCancel={closeEditor}
          onConfirm={(blob) => {
            closeEditor()
            void uploadBlob(blob)
          }}
        />
      )}
    </div>
  )
}