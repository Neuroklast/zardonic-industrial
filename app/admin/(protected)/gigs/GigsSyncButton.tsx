'use client'

import { useState } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { syncGigsFromBandsintown, type GigsSyncResult } from '@/app/admin/_actions/gigsSync'

export function GigsSyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GigsSyncResult | { error: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      setResult(await syncGigsFromBandsintown())
    } finally {
      setLoading(false)
    }
  }

  const isError = result && 'error' in result

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-900/70 hover:bg-emerald-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        <ArrowsClockwise className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing from Bandsintown…' : 'Sync from Bandsintown'}
      </button>

      {result ? (
        <div
          className={`rounded border p-3 text-sm font-mono ${
            isError ? 'border-red-800 bg-red-950/40 text-red-200' : 'border-zinc-700 bg-zinc-900/60 text-zinc-300'
          }`}
        >
          {isError ? (
            <p>{result.error}</p>
          ) : (
            <ul className="space-y-1">
              <li>Imported: {result.synced}</li>
              <li>Updated: {result.updated}</li>
              <li>Skipped: {result.skipped}</li>
              {result.errors.length > 0 ? (
                <li className="text-amber-300">
                  {result.errors.length} error(s): {result.errors.slice(0, 3).join(' · ')}
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}