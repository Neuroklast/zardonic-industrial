import { useState, useCallback, useRef, useEffect } from 'react'
import { createSignedUploadUrl } from '@/app/admin/_actions/r2Upload'
import { toast } from 'sonner'

const R2_BUCKET = process.env.NEXT_PUBLIC_R2_BUCKET_MEDIA ?? 'zardonic-media'

interface VideoUploadResponse {
  url: string
  fileName: string
  mimeType: string
  size: number
}

interface UseVideoUploadResult {
  upload: (file: File) => Promise<VideoUploadResponse | null>
  progress: number
  isUploading: boolean
}

export function useVideoUpload(): UseVideoUploadResult {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const progressResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const upload = useCallback(async (file: File): Promise<VideoUploadResponse | null> => {
    if (progressResetTimerRef.current !== null) {
      clearTimeout(progressResetTimerRef.current)
      progressResetTimerRef.current = null
    }

    if (isMountedRef.current) {
      setIsUploading(true)
      setProgress(0)
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
    const pathKey = `videos/${Date.now()}-${safeName}`

    try {
      if (isMountedRef.current) setProgress(10)
      const { url: signedUrl, publicUrl } = await createSignedUploadUrl(R2_BUCKET, pathKey)
      if (isMountedRef.current) setProgress(40)

      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)

      if (isMountedRef.current) setProgress(100)
      toast.success(`"${file.name}" uploaded.`)
      return { url: publicUrl, fileName: safeName, mimeType: file.type, size: file.size }
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
