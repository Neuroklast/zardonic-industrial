'use client'

import { useState, useRef } from 'react'
import { MEDIA_BUCKET } from '@/lib/constants'
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
}

export function ImageUploader({
  label = 'Upload Image',
  currentUrl,
  storagePrefix = 'uploads',
  onUpload,
  onError,
  accept = 'image/*',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    setUploading(true)
    try {
      const { createSignedUploadUrl } = await import('@/app/admin/_actions/r2Upload')
      const bucket = MEDIA_BUCKET
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const safePrefix = storagePrefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
      const path = `${safePrefix}/${Date.now()}.${ext}`
      const { url, objectPath, publicUrl } = await createSignedUploadUrl(bucket, path)

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      setPreview(URL.createObjectURL(file))
      onUpload(objectPath, publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      onError?.(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
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
        disabled={uploading}
        className="px-3 py-1.5 text-sm rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}