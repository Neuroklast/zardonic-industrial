'use client'

import { useState } from 'react'
import { VideoUploader } from '@/app/admin/_components/VideoUploader'
import { cacheRemoteVideoToR2 } from '@/app/admin/_actions/cacheRemoteVideo'

type SourceMode = 'upload' | 'url' | 'drive'

interface VideoSourcePickerProps {
  label?: string
  currentUrl?: string | null
  storagePrefix?: string
  onResolved: (storagePath: string, publicUrl?: string) => void
  onError?: (message: string) => void
}

export function VideoSourcePicker({
  label = 'Video',
  currentUrl,
  storagePrefix = 'uploads/videos',
  onResolved,
  onError,
}: VideoSourcePickerProps) {
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
      const result = await cacheRemoteVideoToR2(trimmed, { prefix: storagePrefix })
      if (!result.ok || !result.storagePath) {
        const msg = result.error ?? 'Failed to cache video'
        setStatus(msg)
        onError?.(msg)
        return
      }
      if (result.publicUrl) setPreview(result.publicUrl)
      onResolved(result.storagePath, result.publicUrl)
      setStatus(`${sourceLabel} cached to R2`)
      setLinkInput('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cache video'
      setStatus(msg)
      onError?.(msg)
    } finally {
      setCaching(false)
    }
  }

  const tabs: { id: SourceMode; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'url', label: 'Video URL' },
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
        <video
          src={preview}
          className="w-full max-w-xs rounded border border-zinc-700"
          controls
          muted
          preload="metadata"
        />
      )}

      {mode === 'upload' && (
        <VideoUploader
          label="Choose file"
          currentUrl={preview}
          storagePrefix={storagePrefix}
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
            placeholder="https://example.com/background.mp4"
            className="w-full font-mono text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-300"
          />
          <p className="text-xs text-zinc-500">
            Video is downloaded server-side and stored in R2 (max 50 MB).
          </p>
          <button
            type="button"
            disabled={caching}
            onClick={() => handleCacheLink(linkInput, 'Video')}
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
            Paste a public Google Drive share link (MP4/WebM, max 50 MB).
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