'use client'

import { useState } from 'react'
import {
  previewReleaseFromExternalId,
  syncReleaseFromExternalId,
  type ReleaseExternalPreviewResult,
} from '@/app/admin/_actions/releaseExternalSync'
import type { ExternalReleaseSource } from '@/lib/release-external-ids'
import type { ReleaseMetadata } from '@/lib/release-metadata'

interface ReleaseExternalIdsSectionProps {
  releaseId?: string
  initialItunesId?: string
  initialSpotifyId?: string
  initialDiscogsId?: string
  onPreview?: (metadata: ReleaseMetadata) => void
  onSynced?: (payload: {
    metadata: ReleaseMetadata
    coverUrl?: string
    coverStoragePath?: string
    itunesId?: string
    spotifyId?: string
    discogsId?: string
  }) => void
  onError?: (message: string) => void
}

const SOURCES: Array<{ key: ExternalReleaseSource; label: string; field: string; placeholder: string }> = [
  { key: 'itunes', label: 'iTunes / Apple Music ID', field: 'itunes_id', placeholder: '123456789 or Apple Music URL' },
  { key: 'spotify', label: 'Spotify ID', field: 'spotify_id', placeholder: '22-char id or open.spotify.com/album/…' },
  { key: 'discogs', label: 'Discogs ID', field: 'discogs_id', placeholder: '12345 or discogs.com/release/…' },
]

export function ReleaseExternalIdsSection({
  releaseId,
  initialItunesId = '',
  initialSpotifyId = '',
  initialDiscogsId = '',
  onPreview,
  onSynced,
  onError,
}: ReleaseExternalIdsSectionProps) {
  const [itunesId, setItunesId] = useState(initialItunesId)
  const [spotifyId, setSpotifyId] = useState(initialSpotifyId)
  const [discogsId, setDiscogsId] = useState(initialDiscogsId)
  const [pending, setPending] = useState<ExternalReleaseSource | null>(null)

  const values: Record<ExternalReleaseSource, string> = {
    itunes: itunesId,
    spotify: spotifyId,
    discogs: discogsId,
  }

  const setters: Record<ExternalReleaseSource, (v: string) => void> = {
    itunes: setItunesId,
    spotify: setSpotifyId,
    discogs: setDiscogsId,
  }

  async function handleAction(source: ExternalReleaseSource, mode: 'preview' | 'sync') {
    const rawId = values[source]
    if (!rawId.trim()) {
      onError?.(`Enter a ${source} id or URL first`)
      return
    }

    setPending(source)
    onError?.('')

    try {
      if (mode === 'preview' || !releaseId) {
        const result: ReleaseExternalPreviewResult = await previewReleaseFromExternalId(source, rawId)
        if (!result.ok || !result.metadata) {
          onError?.(result.error ?? 'Preview failed')
          return
        }
        onPreview?.(result.metadata)
        if (result.metadata.itunes_id) setItunesId(result.metadata.itunes_id)
        if (result.metadata.spotify_id) setSpotifyId(result.metadata.spotify_id)
        if (result.metadata.discogs_id) setDiscogsId(result.metadata.discogs_id)
        return
      }

      const result = await syncReleaseFromExternalId(releaseId, source, rawId)
      if (!result.ok || !result.metadata) {
        onError?.(result.error ?? 'Sync failed')
        return
      }
      onSynced?.({
        metadata: result.metadata,
        coverUrl: result.coverUrl,
        coverStoragePath: result.coverStoragePath,
        itunesId: result.metadata.itunes_id ?? undefined,
        spotifyId: result.metadata.spotify_id ?? undefined,
        discogsId: result.metadata.discogs_id ?? undefined,
      })
      if (result.metadata.itunes_id) setItunesId(result.metadata.itunes_id)
      if (result.metadata.spotify_id) setSpotifyId(result.metadata.spotify_id)
      if (result.metadata.discogs_id) setDiscogsId(result.metadata.discogs_id)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4 rounded border border-zinc-800 bg-zinc-900/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">External catalogue IDs</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Paste an ID or platform URL, then preview metadata or sync into this release.
        </p>
      </div>

      {SOURCES.map(({ key, label, field, placeholder }) => (
        <div key={key} className="space-y-2">
          <label className="block text-sm text-zinc-300">{label}</label>
          <input
            name={field}
            value={values[key]}
            onChange={(e) => setters[key](e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => handleAction(key, releaseId ? 'sync' : 'preview')}
              className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-50"
            >
              {pending === key ? 'Working…' : releaseId ? `Sync from ${key}` : `Load from ${key}`}
            </button>
            {releaseId && (
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => handleAction(key, 'preview')}
                className="px-3 py-1.5 text-xs rounded border border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
              >
                Preview only
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}