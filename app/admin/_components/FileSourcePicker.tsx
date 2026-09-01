'use client'

import { useRef, useState } from 'react'
import {
  MEDIA_ACCEPT,
  MEDIA_MULTIPART_THRESHOLD_BYTES,
  mediaKindFromMime,
  validateMediaUpload,
} from '@/lib/media-download'
import { useR2MultipartUpload } from '@/hooks/useR2MultipartUpload'
import { contentObjectKey } from '@/lib/r2-object-key'
import { describeR2UploadError } from '@/lib/r2-upload-error'
import { deletePreviousR2ObjectIfReplaced } from '@/app/admin/_lib/deletePreviousR2Object'

export interface FileSourceResolved {
  storagePath: string
  publicUrl?: string
  mime: string
  sizeBytes: number
  originalFilename: string
}

interface FileSourcePickerProps {
  label?: string
  currentUrl?: string | null
  currentStoragePath?: string | null
  currentMime?: string | null
  currentFilename?: string | null
  storagePrefix?: string
  onResolved: (result: FileSourceResolved) => void
  onCleared?: () => void
  onError?: (message: string) => void
}

export function FileSourcePicker({
  label = 'File',
  currentUrl,
  currentStoragePath = null,
  currentMime = null,
  currentFilename = null,
  storagePrefix = 'media-downloads',
  onResolved,
  onCleared,
  onError,
}: FileSourcePickerProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [activePath, setActivePath] = useState<string | null>(currentStoragePath)
  const [mime, setMime] = useState<string | null>(currentMime)
  const [filename, setFilename] = useState<string | null>(currentFilename)
  const [status, setStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const multipart = useR2MultipartUpload()

  async function commitNewFile(result: FileSourceResolved, successMessage: string) {
    const previousPath = activePath
    setPreview(result.publicUrl ?? null)
    setActivePath(result.storagePath)
    setMime(result.mime)
    setFilename(result.originalFilename)
    onResolved(result)

    const cleanup = await deletePreviousR2ObjectIfReplaced(previousPath, result.storagePath)
    if (cleanup.error) {
      setStatus(`${successMessage} — previous file not deleted: ${cleanup.error}`)
      return
    }
    setStatus(cleanup.deleted ? `${successMessage} (previous file removed from storage)` : successMessage)
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const check = validateMediaUpload(file.type, file.size, file.name)
    if (!check.ok) {
      onError?.(check.error)
      setStatus(check.error)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploading(true)
    setStatus(null)
    try {
      const safePrefix =
        storagePrefix.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'media-downloads'
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'

      let storagePath: string
      let publicUrl: string | undefined

      if (file.size >= MEDIA_MULTIPART_THRESHOLD_BYTES) {
        const key = await multipart.upload(file, safePrefix)
        if (!key) throw new Error(multipart.error ?? 'Upload failed')
        const { publicUrlForR2Object } = await import('@/app/admin/_actions/r2Upload')
        storagePath = key
        publicUrl = (await publicUrlForR2Object(key)).publicUrl
      } else {
        const { createSignedUploadUrl } = await import('@/app/admin/_actions/r2Upload')
        const objectKey = await contentObjectKey({
          prefix: safePrefix,
          data: await file.arrayBuffer(),
          extension: ext,
        })
        const signed = await createSignedUploadUrl(objectKey)
        const uploadRes = await fetch(signed.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': check.mime },
        })
        if (!uploadRes.ok) throw new Error('Upload failed')
        storagePath = signed.objectPath
        publicUrl = signed.publicUrl
      }

      await commitNewFile(
        {
          storagePath,
          publicUrl,
          mime: check.mime,
          sizeBytes: file.size,
          originalFilename: file.name.replace(/^.*[/\\]/, '').slice(0, 180),
        },
        'File uploaded to R2',
      )
    } catch (err) {
      const msg = describeR2UploadError(err, 'File upload')
      setStatus(msg)
      onError?.(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(deleteFromStorage: boolean) {
    setRemoving(true)
    setStatus(null)
    try {
      if (deleteFromStorage && activePath) {
        const { deleteR2MediaObject } = await import('@/app/admin/_actions/r2Upload')
        const result = await deleteR2MediaObject(activePath)
        if (!result.ok) {
          setStatus(result.error)
          onError?.(result.error)
          return
        }
      }
      setPreview(null)
      setActivePath(null)
      setMime(null)
      setFilename(null)
      onCleared?.()
      setStatus(deleteFromStorage ? 'File deleted from storage' : 'Selection cleared')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove file'
      setStatus(msg)
      onError?.(msg)
    } finally {
      setRemoving(false)
    }
  }

  const kind = mediaKindFromMime(mime, filename)
  const progress =
    uploading && multipart.status === 'uploading'
      ? `Uploading… ${Math.round(multipart.progress * 100)}%`
      : uploading
        ? 'Uploading…'
        : label

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300">{label}</p>
      {preview && kind === 'image' ? (
        <img src={preview} alt="" className="h-24 w-24 rounded border border-zinc-700 object-cover" />
      ) : null}
      {preview && kind === 'audio' ? (
        <audio src={preview} controls preload="metadata" className="w-full max-w-sm" />
      ) : null}
      {filename ? (
        <p className="font-mono text-xs text-zinc-400">
          {filename}
          {mime ? ` · ${mime}` : ''}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || removing}
          className="px-3 py-1.5 text-sm rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {progress}
        </button>
        {activePath ? (
          <button
            type="button"
            onClick={() => void handleRemove(true)}
            disabled={uploading || removing}
            className="px-3 py-1.5 text-sm rounded border border-red-800 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            Delete upload
          </button>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept={MEDIA_ACCEPT} onChange={handleFileChange} className="hidden" />
      <p className="text-xs text-zinc-500">
        JPEG, PNG, WebP, GIF, PDF, ZIP, MP3, WAV. Images 25 MB, PDF 25 MB, ZIP 100 MB, audio 50 MB. Stored as original
        files (no WebP conversion).
      </p>
      {status ? <p className="text-xs text-zinc-400">{status}</p> : null}
    </div>
  )
}
