'use client'

import { useState, useCallback, useRef } from 'react'
import {
  createMultipartUploadAction,
  signMultipartPartAction,
  completeMultipartUploadAction,
  abortMultipartUploadAction,
} from '@/app/admin/_actions/r2Multipart'
import type { CompletedPart } from '@/lib/storage/r2-multipart'

/** Minimum part size for S3 multipart upload (5 MB). */
const PART_SIZE = 5 * 1024 * 1024

export type MultipartUploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'aborted'

export interface MultipartUploadState {
  status: MultipartUploadStatus
  progress: number
  objectKey: string | null
  error: string | null
}

export function useR2MultipartUpload() {
  const [state, setState] = useState<MultipartUploadState>({
    status: 'idle',
    progress: 0,
    objectKey: null,
    error: null,
  })

  const abortRef = useRef<{ key: string; uploadId: string } | null>(null)

  const upload = useCallback(
    async (file: File, keyPrefix: string): Promise<string | null> => {
      setState({ status: 'uploading', progress: 0, objectKey: null, error: null })

      const ext = file.name.split('.').pop() ?? 'bin'
      const key = `${keyPrefix}/${Date.now()}.${ext}`

      let uploadId: string | null = null

      try {
        const { uploadId: id } = await createMultipartUploadAction(key, file.type)
        uploadId = id
        abortRef.current = { key, uploadId }

        const totalParts = Math.ceil(file.size / PART_SIZE)
        const completedParts: CompletedPart[] = []

        for (let i = 0; i < totalParts; i++) {
          const start = i * PART_SIZE
          const end = Math.min(start + PART_SIZE, file.size)
          const chunk = file.slice(start, end)
          const partNumber = i + 1

          const { signedUrl } = await signMultipartPartAction(key, uploadId, partNumber)

          const response = await fetch(signedUrl, {
            method: 'PUT',
            body: chunk,
          })

          if (!response.ok) {
            throw new Error(`Part ${partNumber} upload failed: ${response.statusText}`)
          }

          const etag = response.headers.get('ETag')
          if (!etag) throw new Error(`Missing ETag for part ${partNumber}`)

          completedParts.push({ PartNumber: partNumber, ETag: etag })
          setState((s) => ({ ...s, progress: completedParts.length / totalParts }))
        }

        await completeMultipartUploadAction(key, uploadId, completedParts)
        abortRef.current = null

        setState({ status: 'success', progress: 1, objectKey: key, error: null })
        return key
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload failed'

        if (uploadId) {
          try {
            await abortMultipartUploadAction(key, uploadId)
          } catch {
            // best-effort abort
          }
        }

        abortRef.current = null
        setState({ status: 'error', progress: 0, objectKey: null, error: message })
        return null
      }
    },
    [],
  )

  const abort = useCallback(async () => {
    const current = abortRef.current
    if (!current) return
    abortRef.current = null
    try {
      await abortMultipartUploadAction(current.key, current.uploadId)
    } catch {
      // best-effort
    }
    setState({ status: 'aborted', progress: 0, objectKey: null, error: null })
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, objectKey: null, error: null })
  }, [])

  return { ...state, upload, abort, reset }
}
