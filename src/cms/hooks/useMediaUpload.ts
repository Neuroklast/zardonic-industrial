/**
 * useMediaUpload — handles media file upload with progress and image compression.
 * OWASP A04:2021 — file type and size validated before sending.
 */

import { useState } from 'react'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  id: string
  url: string
  thumbnailUrl?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']
const MAX_SIZE_MB = 20

export function useMediaUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, folder = 'general', alt?: string): Promise<UploadResult | null> {
    // OWASP A04:2021 — Validate file type and size client-side
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not allowed')
      return null
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large (max ${MAX_SIZE_MB} MB)`)
      return null
    }

    setStatus('uploading')
    setError(null)

    try {
      // Convert to base64 for JSON API transport
      const base64 = await fileToBase64(file)

      const res = await fetch('/api/cms/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          data: base64,
          folder,
          alt: alt ?? '',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Upload failed (${res.status})`)
      }

      const result = await res.json() as UploadResult
      setStatus('success')
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
      return null
    }
  }

  return { upload, status, error }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data: URL prefix
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
