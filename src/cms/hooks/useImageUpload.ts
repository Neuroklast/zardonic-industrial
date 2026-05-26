import { useState, useCallback, useRef, useEffect } from 'react'
import { upload as blobUpload } from '@vercel/blob/client'
import { toast } from 'sonner'

interface ImageUploadResponse {
  url: string
  fileName: string
  mimeType: string
  size: number
}

interface UseImageUploadResult {
  upload: (file: File) => Promise<ImageUploadResponse | null>
  progress: number
  isUploading: boolean
}

export function useImageUpload(): UseImageUploadResult {
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

  const upload = useCallback(async (file: File): Promise<ImageUploadResponse | null> => {
    // Cancel any pending progress reset before starting a new upload
    if (progressResetTimerRef.current !== null) {
      clearTimeout(progressResetTimerRef.current)
      progressResetTimerRef.current = null
    }

    if (isMountedRef.current) {
      setIsUploading(true)
      setProgress(0)
    }

    // Sanitise filename — keep only safe characters; include a timestamp to avoid collisions
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
    const pathname = `images/${Date.now()}-${safeName}`

    try {
      const blob = await blobUpload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/cms/image-upload-token',
        onUploadProgress: ({ percentage }) => {
          if (isMountedRef.current) setProgress(Math.round(percentage))
        },
      })

      if (isMountedRef.current) setProgress(100)
      toast.success(`"${file.name}" uploaded.`)
      return {
        url: blob.url,
        fileName: safeName,
        mimeType: file.type,
        size: file.size,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.'
      toast.error(message)
      return null
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false)
        progressResetTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setProgress(0)
          progressResetTimerRef.current = null
        }, 800)
      }
    }
  }, [])

  return { upload, progress, isUploading }
}
