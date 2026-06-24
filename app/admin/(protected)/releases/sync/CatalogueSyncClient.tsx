'use client'

import { useState } from 'react'
import { syncReleasesFromItunes, type ItunesSyncResult } from '@/app/admin/_actions/itunesSync'
import { SyncJobStatus } from '@/app/admin/_components/SyncJobStatus'
import { CatalogueSyncSettings } from '@/app/admin/_components/CatalogueSyncSettings'
import { useSyncJobPoll } from '@/hooks/useSyncJobPoll'
import type { CatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import type { BulkExternalSyncResult } from '@/lib/catalogue-import'
import { startSyncJob } from '@/lib/sync-job-client'

type SyncSource = 'itunes' | 'spotify' | 'discogs'

interface CatalogueSyncClientProps {
  initialConfig: CatalogueSyncConfig
}

export function CatalogueSyncClient({ initialConfig }: CatalogueSyncClientProps) {
  const [source, setSource] = useState<SyncSource>('itunes')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ItunesSyncResult | BulkExternalSyncResult | null>(null)
  const { job, error: jobError, polling, startPolling } = useSyncJobPoll()

  async function handleSync(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      if (source === 'itunes') {
        setResult(await syncReleasesFromItunes())
      } else if (source === 'spotify') {
        const { jobId } = await startSyncJob('spotify_sync')
        startPolling(jobId)
      } else {
        const { jobId } = await startSyncJob('discogs_sync')
        startPolling(jobId)
      }
    } catch (err) {
      setResult({
        synced: 0,
        updated: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Sync failed'],
      })
    } finally {
      setLoading(false)
    }
  }

  const descriptions: Record<SyncSource, string> = {
    itunes:
      'Import releases using the saved iTunes artist ID (lookup API) or artist name search fallback.',
    spotify:
      'Import albums/singles using the saved Spotify artist ID. Runs as a background job with progress polling.',
    discogs:
      'Import releases using the saved Discogs artist ID. Runs as a background job to avoid gateway timeouts.',
  }

  const configuredId: Record<SyncSource, string> = {
    itunes: initialConfig.itunesArtistId,
    spotify: initialConfig.spotifyArtistId,
    discogs: initialConfig.discogsArtistId,
  }

  const canSync = Boolean(configuredId[source]) || Boolean(initialConfig.artistName.trim())
  const isAsyncSource = source === 'spotify' || source === 'discogs'

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
            disabled={loading || polling || !canSync}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-900/80 hover:bg-red-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || polling ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                {polling ? 'Sync job running…' : 'Starting…'}
              </>
            ) : (
              `Sync from ${source === 'itunes' ? 'iTunes' : source === 'spotify' ? 'Spotify' : 'Discogs'}`
            )}
          </button>
        </form>

        {jobError && <p className="text-xs text-red-400">{jobError}</p>}
      </div>

      {job && isAsyncSource && <SyncJobStatus job={job} />}

      {result && source === 'itunes' && (
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">Sync Result</h2>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {result.errors.map((err, i) => (
                <li key={i} className="text-xs text-red-300 font-mono bg-red-950/30 rounded px-2 py-1">
                  {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}