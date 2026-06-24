'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { ImageCropEditor } from '@/app/admin/_components/ImageCropEditor'
import { fetchRemoteImageForEdit } from '@/app/admin/_actions/fetchRemoteImageForEdit'
import { cacheRemoteImageToR2 } from '@/app/admin/_actions/cacheRemoteImage'
import { submitOptimizedUpload } from '@/app/admin/_lib/submitOptimizedUpload'
import { shouldOpenImageEditor, type CropFitMode } from '@/lib/image-crop-math'

type SourceMode = 'upload' | 'url' | 'drive'

interface MediaSourcePickerProps {
  label?: string
  currentUrl?: string | null
  storagePrefix?: string
  onResolved: (storagePath: string, publicUrl?: string) => void
  onError?: (message: string) => void
  accept?: string
  enableEditor?: boolean
  editorAspectRatio?: number | null
  editorFitMode?: CropFitMode
  maxOutputDimension?: number
}

export function MediaSourcePicker({
  label = 'Image',
  currentUrl,
  storagePrefix = 'uploads',
  onResolved,
  onError,
  accept = 'image/*',
  enableEditor = true,
  editorAspectRatio = null,
  editorFitMode = 'cover',
  maxOutputDimension = 2400,
}: MediaSourcePickerProps) {
  const [mode, setMode] = useState<SourceMode>('upload')
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [linkInput, setLinkInput] = useState('')
  const [caching, setCaching] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)

  async function finalizeUpload(blob: Blob) {
    setCaching(true)
    setStatus(null)
    try {
      const { storagePath, publicUrl } = await submitOptimizedUpload(blob, storagePrefix)
      if (publicUrl) setPreview(publicUrl)
      onResolved(storagePath, publicUrl || undefined)
      setStatus('Uploaded to R2 (optimized)')
      setLinkInput('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setStatus(msg)
      onError?.(msg)
    } finally {
      setCaching(false)
    }
  }

  async function handleCacheLink(input: string, sourceLabel: string) {
    const trimmed = input.trim()
    if (!trimmed) {
      onError?.('Please enter a URL')
      return
    }

    if (enableEditor) {
      setCaching(true)
      setStatus(null)
      try {
        const fetched = await fetchRemoteImageForEdit(trimmed)
        if (!fetched.ok || !fetched.dataUrl) {
          const msg = fetched.error ?? 'Failed to fetch image'
          setStatus(msg)
          onError?.(msg)
          return
        }

        if (fetched.canEdit && fetched.mimeType && shouldOpenImageEditor(fetched.mimeType)) {
          setEditorSrc(fetched.dataUrl)
          setEditorOpen(true)
          setStatus(`${sourceLabel} ready — adjust framing before upload`)
          return
        }

        const response = await fetch(fetched.dataUrl)
        const blob = await response.blob()
        await finalizeUpload(blob)
        setStatus(`${sourceLabel} cached to R2 (optimized)`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch image'
        setStatus(msg)
        onError?.(msg)
      } finally {
        setCaching(false)
      }
      return
    }

    setCaching(true)
    setStatus(null)
    try {
      const result = await cacheRemoteImageToR2(trimmed, { prefix: storagePrefix })
      if (!result.ok || !result.storagePath) {
        const msg = result.error ?? 'Failed to cache image'
        setStatus(msg)
        onError?.(msg)
        return
      }
      if (result.publicUrl) setPreview(result.publicUrl)
      onResolved(result.storagePath, result.publicUrl)
      setStatus(`${sourceLabel} cached to R2`)
      setLinkInput('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cache image'
      setStatus(msg)
      onError?.(msg)
    } finally {
      setCaching(false)
    }
  }

  const tabs: { id: SourceMode; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'url', label: 'Image URL' },
    { id: 'drive', label: 'Google Drive' },
  ]

  return (
    <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              mode === tab.id
                ? 'border-red-700/60 bg-red-900/30 text-white'
                : 'border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {preview && (
        <div className="relative w-32 h-32 rounded border border-zinc-700 overflow-hidden bg-zinc-900">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain p-1"
            unoptimized
          />
        </div>
      )}

      {mode === 'upload' && (
        <ImageUploader
          label="Choose file"
          currentUrl={preview}
          storagePrefix={storagePrefix}
          accept={accept}
          enableEditor={enableEditor}
          editorAspectRatio={editorAspectRatio}
          editorFitMode={editorFitMode}
          maxOutputDimension={maxOutputDimension}
          onUpload={(path, publicUrl) => {
            if (publicUrl) setPreview(publicUrl)
            onResolved(path, publicUrl)
            setStatus('Uploaded to R2 (optimized)')
          }}
          onError={(msg) => {
            setStatus(msg)
            onError?.(msg)
          }}
        />
      )}

      {mode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full font-mono text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-300"
          />
          <p className="text-xs text-zinc-500">
            Image is fetched for editing, then optimized and stored in R2.
          </p>
          <button
            type="button"
            disabled={caching || editorOpen}
            onClick={() => void handleCacheLink(linkInput, 'Image')}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white disabled:opacity-50"
          >
            {caching ? 'Fetching…' : 'Fetch, adjust & upload'}
          </button>
        </div>
      )}

      {mode === 'drive' && (
        <div className="space-y-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
            className="w-full font-mono text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-300"
          />
          <p className="text-xs text-zinc-500">
            Paste a public Google Drive share link. The file must be shared as &quot;Anyone with the link&quot;.
          </p>
          <button
            type="button"
            disabled={caching || editorOpen}
            onClick={() => void handleCacheLink(linkInput, 'Google Drive file')}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white disabled:opacity-50"
          >
            {caching ? 'Importing…' : 'Import, adjust & upload'}
          </button>
        </div>
      )}

      {status && <p className="text-xs text-zinc-500">{status}</p>}

      {editorSrc && (
        <ImageCropEditor
          open={editorOpen}
          imageSrc={editorSrc}
          title="Adjust & crop image"
          aspectRatio={editorAspectRatio}
          fitMode={editorFitMode}
          maxOutputDimension={maxOutputDimension}
          onCancel={() => {
            setEditorOpen(false)
            setEditorSrc(null)
          }}
          onConfirm={(blob) => {
            setEditorOpen(false)
            setEditorSrc(null)
            void finalizeUpload(blob)
          }}
        />
      )}
    </div>
  )
}