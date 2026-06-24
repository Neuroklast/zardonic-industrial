'use client'

import { useState } from 'react'
import Link from 'next/link'
import { syncReleasesFromItunes, type ItunesSyncResult } from '@/app/admin/_actions/itunesSync'
import {
  syncReleasesFromDiscogs,
  syncReleasesFromSpotify,
  type BulkExternalSyncResult,
} from '@/app/admin/_actions/releaseExternalSync'
import { CatalogueSyncSettings } from '@/app/admin/_components/CatalogueSyncSettings'
import type { CatalogueSyncConfig } from '@/lib/catalogue-sync-config'

type SyncSource = 'itunes' | 'spotify' | 'discogs'

interface CatalogueSyncClientProps {
  initialConfig: CatalogueSyncConfig
}

export function CatalogueSyncClient({ initialConfig }: CatalogueSyncClientProps) {
  const [source, setSource] = useState<SyncSource>('itunes')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ItunesSyncResult | BulkExternalSyncResult | null>(null)

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      if (source === 'itunes') {
        setResult(await syncReleasesFromItunes())
      } else if (source === 'spotify') {
        setResult(await syncReleasesFromSpotify())
      } else {
        setResult(await syncReleasesFromDiscogs())
      }
    } finally {
      setLoading(false)
    }
  }

  const descriptions: Record<SyncSource, string> = {
    itunes:
      'Import releases using the saved iTunes artist ID (lookup API) or artist name search fallback.',
    spotify:
      'Import albums/singles using the saved Spotify artist ID. Requires Spotify credentials in Admin → API Keys.',
    discogs:
      'Import releases using the saved Discogs artist ID. Requires Discogs token in Admin → API Keys.',
  }

  const configuredId: Record<SyncSource, string> = {
    itunes: initialConfig.itunesArtistId,
    spotify: initialConfig.spotifyArtistId,
    discogs: initialConfig.discogsArtistId,
  }

  const canSync = Boolean(configuredId[source]) || Boolean(initialConfig.artistName.trim())

  return (
    <div className="max-w-xl space-y-6">
      <CatalogueSyncSettings initialConfig={initialConfig} />

      <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
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

        {configuredId[source] ? (
          <p className="text-xs text-zinc-500 font-mono">
            Using saved ID: {configuredId[source]}
          </p>
        ) : (
          <p className="text-xs text-amber-500/90">
            No {source} artist ID saved — sync will use artist name “{initialConfig.artistName}” where supported.
          </p>
        )}

        <form onSubmit={handleSync} className="space-y-4">
          <button
            type="submit"
            disabled={loading || !canSync}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-900/80 hover:bg-red-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
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

          <div className={`grid gap-3 ${'updated' in result ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{result.synced}</div>
              <div className="text-xs text-zinc-500 mt-1">Imported</div>
            </div>
            {'updated' in result ? (
              <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{result.updated}</div>
                <div className="text-xs text-zinc-500 mt-1">Tracklists updated</div>
              </div>
            ) : null}
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

          {(result.synced > 0 || ('updated' in result && result.updated > 0)) && (
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