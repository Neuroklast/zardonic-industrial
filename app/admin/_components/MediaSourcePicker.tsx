'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { cacheRemoteImageToR2 } from '@/app/admin/_actions/cacheRemoteImage'

type SourceMode = 'upload' | 'url' | 'drive'

interface MediaSourcePickerProps {
  label?: string
  currentUrl?: string | null
  storagePrefix?: string
  onResolved: (storagePath: string, publicUrl?: string) => void
  onError?: (message: string) => void
  accept?: string
}

export function MediaSourcePicker({
  label = 'Image',
  currentUrl,
  storagePrefix = 'uploads',
  onResolved,
  onError,
  accept = 'image/*',
}: MediaSourcePickerProps) {
  const [mode, setMode] = useState<SourceMode>('upload')
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [linkInput, setLinkInput] = useState('')
  const [caching, setCaching] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleCacheLink(input: string, sourceLabel: string) {
    const trimmed = input.trim()
    if (!trimmed) {
      onError?.('Please enter a URL')
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
          onUpload={(path, publicUrl) => {
            if (publicUrl) setPreview(publicUrl)
            onResolved(path, publicUrl)
            setStatus('Uploaded to R2')
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
            Image is downloaded server-side and stored in R2 (cached on your CDN).
          </p>
          <button
            type="button"
            disabled={caching}
            onClick={() => handleCacheLink(linkInput, 'Image')}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white disabled:opacity-50"
          >
            {caching ? 'Caching…' : 'Fetch & cache to R2'}
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
            disabled={caching}
            onClick={() => handleCacheLink(linkInput, 'Google Drive file')}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white disabled:opacity-50"
          >
            {caching ? 'Caching…' : 'Import from Drive → R2'}
          </button>
        </div>
      )}

      {status && <p className="text-xs text-zinc-500">{status}</p>}
    </div>
  )
}