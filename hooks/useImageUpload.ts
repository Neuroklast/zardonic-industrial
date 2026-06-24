'use client'

import { useState, useCallback } from 'react'
import { uploadOptimizedImage } from '@/app/admin/_actions/uploadOptimizedImage'
import { DEFAULT_MAX_IMAGE_HEIGHT, DEFAULT_MAX_IMAGE_WIDTH } from '@/lib/optimize-image-constants'

export type ImageUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface ImageUploadState {
  status: ImageUploadStatus
  progress: number
  storagePath: string | null
  publicUrl: string | null
  error: string | null
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

export function useImageUpload(bucket: string, pathPrefix: string) {
  const [state, setState] = useState<ImageUploadState>({
    status: 'idle',
    progress: 0,
    storagePath: null,
    publicUrl: null,
    error: null,
  })

  const upload = useCallback(async (file: File): Promise<void> => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setState((s) => ({ ...s, status: 'error', error: 'Only JPEG, PNG, WebP and GIF are supported.' }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setState((s) => ({ ...s, status: 'error', error: 'Image must not exceed 10 MB.' }))
      return
    }

    setState({ status: 'uploading', progress: 0, storagePath: null, publicUrl: null, error: null })

    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('prefix', pathPrefix)
      formData.set('maxWidth', String(DEFAULT_MAX_IMAGE_WIDTH))
      formData.set('maxHeight', String(DEFAULT_MAX_IMAGE_HEIGHT))

      const result = await uploadOptimizedImage(formData)
      if (!result.ok || !result.storagePath) {
        throw new Error(result.error ?? 'Upload failed')
      }

      void bucket
      setState({
        status: 'success',
        progress: 1,
        storagePath: result.storagePath,
        publicUrl: result.publicUrl ?? null,
        error: null,
      })
    } catch (e) {
      setState({
        status: 'error',
        progress: 0,
        storagePath: null,
        publicUrl: null,
        error: e instanceof Error ? e.message : 'Upload failed',
      })
    }
  }, [bucket, pathPrefix])

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, storagePath: null, publicUrl: null, error: null })
  }, [])

  return { ...state, upload, reset }
}