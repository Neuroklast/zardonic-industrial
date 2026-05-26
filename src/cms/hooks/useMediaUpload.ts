import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ROUTES } from '@/lib/api-routes'

interface MediaUploadResponse {
  id: string
  url: string
  thumbnailUrl?: string
  fileName: string
  mimeType: string
  size: number
  width?: number
  height?: number
  uploadedAt: string
}

interface UseMediaUploadResult {
  upload: (file: File) => Promise<MediaUploadResponse | null>
  progress: number
  isUploading: boolean
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function useMediaUpload(): UseMediaUploadResult {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const progressResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track mount state so async completions don't call setState after unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (progressResetTimerRef.current !== null) {
        clearTimeout(progressResetTimerRef.current)
      }
    }
  }, [])

  const upload = useCallback(async (file: File): Promise<MediaUploadResponse | null> => {
    // Cancel any pending progress reset before starting a new upload
    if (progressResetTimerRef.current !== null) {
      clearTimeout(progressResetTimerRef.current)
      progressResetTimerRef.current = null
    }

    if (isMountedRef.current) {
      setIsUploading(true)
      setProgress(0)
    }

    try {
      if (isMountedRef.current) setProgress(10)
      const dataUrl = await fileToDataUrl(file)
      if (isMountedRef.current) setProgress(40)

      const res = await fetch(API_ROUTES.CMS_MEDIA, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        }),
      })

      if (isMountedRef.current) setProgress(90)

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Upload failed: ${res.status}`)
      }

      const result = await res.json() as MediaUploadResponse
      if (isMountedRef.current) setProgress(100)
      toast.success(`"${file.name}" uploaded.`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      toast.error(message)
      return null
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false)
        // Reset progress after a short delay so the UI can show 100%
        progressResetTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setProgress(0)
          progressResetTimerRef.current = null
        }, 800)
      }
    }
  }, [])

  return { upload, progress, isUploading }
}
