'use client'

import { useState } from 'react'
import Link from 'next/link'
import { syncReleasesFromItunes, type ItunesSyncResult } from '@/app/admin/_actions/itunesSync'
import {
  syncReleasesFromDiscogs,
  syncReleasesFromSpotify,
  type BulkExternalSyncResult,
} from '@/app/admin/_actions/releaseExternalSync'

type SyncSource = 'itunes' | 'spotify' | 'discogs'

export default function ExternalSyncPage() {
  const [source, setSource] = useState<SyncSource>('itunes')
  const [artist, setArtist] = useState('Zardonic')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ItunesSyncResult | BulkExternalSyncResult | null>(null)

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      if (source === 'itunes') {
        setResult(await syncReleasesFromItunes(artist))
      } else if (source === 'spotify') {
        setResult(await syncReleasesFromSpotify(artist))
      } else {
        setResult(await syncReleasesFromDiscogs(artist))
      }
    } finally {
      setLoading(false)
    }
  }

  const descriptions: Record<SyncSource, string> = {
    itunes:
      'Search the iTunes catalogue for an artist and import new releases. Artwork is cached to R2 automatically.',
    spotify:
      'Resolve the artist on Spotify and import albums/singles/compilations. Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.',
    discogs:
      'Resolve the artist on Discogs and import their release list. Requires DISCOGS_TOKEN.',
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/releases" className="text-zinc-500 hover:text-white text-sm transition-colors">
          ← Discography
        </Link>
        <h1 className="text-xl font-bold">Catalogue Sync</h1>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['itunes', 'spotify', 'discogs'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSource(key)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                source === key
                  ? 'border-red-600 bg-red-900/30 text-white'
                  : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              {key === 'itunes' ? 'iTunes' : key === 'spotify' ? 'Spotify' : 'Discogs'}
            </button>
          ))}
        </div>

        <p className="text-sm text-zinc-400">{descriptions[source]}</p>

        <form onSubmit={handleSync} className="space-y-4">
          <div>
            <label htmlFor="artist" className="block text-sm text-zinc-300 mb-1">
              Artist name
            </label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              placeholder="e.g. Zardonic"
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !artist.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-900/80 hover:bg-red-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Syncing…
              </>
            ) : (
              `Sync from ${source === 'itunes' ? 'iTunes' : source === 'spotify' ? 'Spotify' : 'Discogs'}`
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">Sync Result</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{result.synced}</div>
              <div className="text-xs text-zinc-500 mt-1">Imported</div>
            </div>
            <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
              <div className="text-2xl font-bold text-zinc-400">{result.skipped}</div>
              <div className="text-xs text-zinc-500 mt-1">Already existed</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 mb-2">
                {result.errors.length} warning{result.errors.length > 1 ? 's' : ''}
              </p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-300 font-mono bg-red-950/30 rounded px-2 py-1">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.synced > 0 && (
            <Link
              href="/admin/releases"
              className="inline-block text-sm text-zinc-300 hover:text-white transition-colors underline underline-offset-2"
            >
              View imported releases →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}