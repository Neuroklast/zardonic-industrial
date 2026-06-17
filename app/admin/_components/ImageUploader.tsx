'use client'

import { useState, useRef } from 'react'

interface ImageUploaderProps {
  label?: string
  currentUrl?: string | null
  onUpload: (storagePath: string) => void
  onError?: (error: string) => void
  accept?: string
}

export function ImageUploader({
  label = 'Upload Image',
  currentUrl,
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

    setUploading(true)
    try {
      // Get signed upload URL
      const { createSignedUploadUrl } = await import('@/app/admin/_actions/r2Upload')
      const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_MEDIA ?? 'zardonic-media'
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `uploads/${Date.now()}.${ext}`
      const { url, objectPath } = await createSignedUploadUrl(bucket, path)

      // Upload directly to R2
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      setPreview(URL.createObjectURL(file))
      onUpload(objectPath)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      onError?.(msg)
    } finally {
      setUploading(false)
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
