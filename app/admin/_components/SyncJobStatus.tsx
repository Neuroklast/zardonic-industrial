'use client'

import Link from 'next/link'
import type { SyncJobRow } from '@/lib/sync-jobs'

interface SyncJobStatusProps {
  job: SyncJobRow
}

export function SyncJobStatus({ job }: SyncJobStatusProps) {
  const { progress, status, phase, type } = job
  const totalLabel =
    progress.total != null ? `${progress.processed} / ${progress.total}` : String(progress.processed)

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-200">Sync Job</h2>
        <span className="text-xs font-mono text-zinc-500">{type}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            status === 'completed'
              ? 'bg-green-900/40 text-green-300'
              : status === 'failed'
                ? 'bg-red-900/40 text-red-300'
                : status === 'cancelled'
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-amber-900/40 text-amber-200'
          }`}
        >
          {status}
          {phase ? ` · ${phase}` : ''}
        </span>
      </div>

      <p className="text-xs text-zinc-400 font-mono">Progress: {totalLabel}</p>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{progress.synced}</div>
          <div className="text-xs text-zinc-500 mt-1">Imported / enriched</div>
        </div>
        <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{progress.updated}</div>
          <div className="text-xs text-zinc-500 mt-1">Updated</div>
        </div>
        <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
          <div className="text-2xl font-bold text-zinc-400">{progress.skipped}</div>
          <div className="text-xs text-zinc-500 mt-1">Skipped</div>
        </div>
      </div>

      {progress.errors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-400 mb-2">
            {progress.errors.length} message{progress.errors.length > 1 ? 's' : ''}
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {progress.errors.slice(0, 20).map((err, i) => (
              <li key={i} className="text-xs text-red-300 font-mono bg-red-950/30 rounded px-2 py-1">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'completed' && (progress.synced > 0 || progress.updated > 0) && type.includes('sync') && (
        <Link
          href={type === 'purge_and_sync_gigs' ? '/admin/gigs' : '/admin/releases'}
          className="inline-block text-sm text-zinc-300 hover:text-white transition-colors underline underline-offset-2"
        >
          View results →
        </Link>
      )}
    </div>
  )
}