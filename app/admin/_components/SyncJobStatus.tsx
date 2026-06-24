'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cancelSyncJobClient } from '@/lib/sync-job-client'
import {
  getSyncJobLabel,
  getSyncJobProgressPercent,
  getSyncJobStatusHeadline,
  getSyncJobStatusMessage,
} from '@/lib/sync-job-messages'
import type { SyncJobRow } from '@/lib/sync-jobs'
import { Progress } from '@/components/ui/progress'

interface SyncJobStatusProps {
  job: SyncJobRow
  onCancelled?: () => void
}

export function SyncJobStatus({ job, onCancelled }: SyncJobStatusProps) {
  const [cancelling, setCancelling] = useState(false)
  const { progress, status, phase, type } = job
  const percent = getSyncJobProgressPercent(job)
  const message = getSyncJobStatusMessage(job)
  const headline = getSyncJobStatusHeadline(status)
  const isActive = status === 'pending' || status === 'running'

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-200">{getSyncJobLabel(type)}</h2>
        {isActive ? (
          <button
            type="button"
            disabled={cancelling}
            onClick={async () => {
              setCancelling(true)
              try {
                await cancelSyncJobClient(job.id)
                onCancelled?.()
              } finally {
                setCancelling(false)
              }
            }}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        ) : null}
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
          {headline}
          {phase ? ` · ${phase}` : ''}
        </span>
      </div>

      <p className="text-sm text-zinc-300">{message}</p>

      {percent != null ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Progress</span>
            <span>
              {progress.total != null
                ? `${progress.processed} / ${progress.total} (${percent}%)`
                : `${percent}%`}
            </span>
          </div>
          <Progress value={percent} className="h-2.5 bg-zinc-800 [&>[data-slot=progress-indicator]]:bg-red-600" />
        </div>
      ) : isActive ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-mono">Progress: preparing next batch…</p>
          <Progress value={12} className="h-2.5 bg-zinc-800 [&>[data-slot=progress-indicator]]:bg-red-600 animate-pulse" />
        </div>
      ) : null}

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

      {progress.errors.length > 0 ? (
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
      ) : null}

      {status === 'completed' &&
        (progress.synced > 0 || progress.updated > 0) &&
        (type.includes('sync') || type === 'track_enrichment') && (
        <Link
          href={
            type === 'purge_and_sync_gigs' || type === 'bandsintown_sync'
              ? '/admin/gigs'
              : '/admin/releases'
          }
          className="inline-block text-sm text-zinc-300 hover:text-white transition-colors underline underline-offset-2"
        >
          View results →
        </Link>
      )}
    </div>
  )
}