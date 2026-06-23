'use client'

import { useState, useRef } from 'react'
import { MEDIA_BUCKET } from '@/lib/constants'
import { REMOTE_VIDEO_MAX_BYTES } from '@/lib/remote-video-url'

const ALLOWED_UPLOAD_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

interface VideoUploaderProps {
  label?: string
  currentUrl?: string | null
  storagePrefix?: string
  onUpload: (storagePath: string, publicUrl?: string) => void
  onError?: (error: string) => void
  accept?: string
}

export function VideoUploader({
  label = 'Upload Video',
  currentUrl,
  storagePrefix = 'uploads/videos',
  onUpload,
  onError,
  accept = 'video/mp4,video/webm',
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > REMOTE_VIDEO_MAX_BYTES) {
      const msg = `File too large (max ${REMOTE_VIDEO_MAX_BYTES / (1024 * 1024)} MB)`
      onError?.(msg)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    if (!ALLOWED_UPLOAD_MIME.has(file.type)) {
      onError?.('Unsupported file type. Use MP4 or WebM.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const { createSignedUploadUrl } = await import('@/app/admin/_actions/r2Upload')
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
      const safePrefix = storagePrefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads/videos'
      const path = `${safePrefix}/${Date.now()}.${ext}`
      const { url, objectPath, publicUrl } = await createSignedUploadUrl(MEDIA_BUCKET, path)

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      if (publicUrl) setPreview(publicUrl)
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
        <video
          src={preview}
          className="w-full max-w-xs rounded border border-zinc-700"
          controls
          muted
          preload="metadata"
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