'use client'

import { useState, useTransition } from 'react'
import { ArrowsClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import {
  applyMediaHostRewriteAction,
  previewMediaHostRewrite,
  type RewriteMediaHostsResult,
} from '@/app/admin/_actions/rewriteMediaHosts'
import {
  applyR2MediaReconcileAction,
  previewR2MediaReconcile,
  type R2ReconcileActionResult,
} from '@/app/admin/_actions/r2Reconcile'
import type { MediaHostRewriteResult } from '@/lib/r2-url-rewrite'
import type { R2ReconcileResult } from '@/lib/r2-reconcile'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function isErrorResult(
  result: RewriteMediaHostsResult | R2ReconcileActionResult,
): result is { error: string } {
  return 'error' in result
}

function ReconcileSummary({ result }: { result: R2ReconcileResult }) {
  const tables = Object.entries(result.byTable)
  return (
    <div className="space-y-2 text-xs">
      <p className="font-mono text-zinc-300">
        Target host: <span className="text-white">{result.publicHost}</span>
        {' · '}
        {result.objectCount} object{result.objectCount === 1 ? '' : 's'} in bucket
        {result.dryRun ? ' (preview)' : ''}
      </p>
      <p className="text-zinc-400">
        Scanned {result.scannedRows} rows · {result.rewrittenRows} would change ·{' '}
        {result.replacements} URL{result.replacements === 1 ? '' : 's'} · unmatched{' '}
        {result.unmatched} · ambiguous {result.ambiguous}
      </p>
      {tables.length > 0 && (
        <ul className="font-mono text-zinc-500">
          {tables.map(([table, count]) => (
            <li key={table}>
              {table}: {count}
            </li>
          ))}
        </ul>
      )}
      {result.samples.length > 0 && (
        <div className="max-h-56 overflow-auto border border-zinc-800 rounded p-2 space-y-2 bg-zinc-950/60">
          {result.samples.map((sample) => (
            <div key={`${sample.table}-${sample.id}-${sample.field}`} className="space-y-0.5">
              <div className="text-zinc-400">
                {sample.table}.{sample.field}{' '}
                <span className="text-zinc-600">({sample.id})</span>
              </div>
              <div className="text-red-300/80 break-all">{sample.from}</div>
              <div className="text-green-300/80 break-all">{sample.to}</div>
            </div>
          ))}
        </div>
      )}
      {result.unmatchedSamples.length > 0 && (
        <div className="max-h-40 overflow-auto border border-amber-900/50 rounded p-2 space-y-1 bg-zinc-950/60">
          <div className="text-amber-200/80">Unmatched / ambiguous</div>
          {result.unmatchedSamples.map((sample) => (
            <div key={`u-${sample.table}-${sample.id}-${sample.field}`} className="text-zinc-500 break-all">
              {sample.table}.{sample.field}: {sample.to}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HostSummary({ result }: { result: MediaHostRewriteResult }) {
  return (
    <p className="text-xs text-zinc-500 font-mono">
      Host rewrite {result.dryRun ? 'preview' : 'applied'}: {result.rewrittenRows} rows /{' '}
      {result.replacements} URLs → {result.publicHost}
    </p>
  )
}

export function MediaHostRewriteClient() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<R2ReconcileResult | null>(null)
  const [applied, setApplied] = useState<R2ReconcileResult | null>(null)
  const [hostResult, setHostResult] = useState<MediaHostRewriteResult | null>(null)

  function runPreview() {
    setError(null)
    setApplied(null)
    startTransition(async () => {
      const result = await previewR2MediaReconcile()
      if (isErrorResult(result)) {
        setError(result.error)
        setPreview(null)
        return
      }
      setPreview(result)
    })
  }

  function runApply() {
    setError(null)
    startTransition(async () => {
      const result = await applyR2MediaReconcileAction()
      if (isErrorResult(result)) {
        setError(result.error)
        return
      }
      setApplied(result)
      setPreview(result)
    })
  }

  function runHostRewrite() {
    setError(null)
    startTransition(async () => {
      const dry = await previewMediaHostRewrite()
      if (isErrorResult(dry)) {
        setError(dry.error)
        return
      }
      const result = await applyMediaHostRewriteAction()
      if (isErrorResult(result)) {
        setError(result.error)
        return
      }
      setHostResult(result)
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <ArrowsClockwise className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Match files in current R2 bucket</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Lists every object in the live bucket, then fixes database URLs whose{' '}
              <strong className="font-medium text-zinc-300">filename</strong> matches but the stored
              host or path is stale (re-uploads that dropped prefixes, percent-encoded{' '}
              <code className="text-zinc-300">wsrv.nl/?url=…</code>, old <code className="text-zinc-300">pub-….r2.dev</code>
              ). Duplicate filenames are skipped. Does not copy files. Export JSON first.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runPreview}
              disabled={pending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <MagnifyingGlass className="h-4 w-4" aria-hidden />
              Preview bucket match
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={pending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-red-900/80 hover:bg-red-800 text-white font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Reconcile now
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Rewrite URLs from live R2 files?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Scans the current bucket and updates stored URLs / storage paths when the filename
                    uniquely matches. Ambiguous names are left unchanged. Download a JSON export first
                    if you have not already.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={runApply}
                    className="bg-red-700 hover:bg-red-600 text-white"
                  >
                    Reconcile URLs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {applied && !applied.dryRun && (
            <p className="text-sm text-green-400">
              Updated {applied.replacements} URL{applied.replacements === 1 ? '' : 's'} in{' '}
              {applied.rewrittenRows} row{applied.rewrittenRows === 1 ? '' : 's'}. Hard-refresh the
              public site.
            </p>
          )}

          {preview && <ReconcileSummary result={preview} />}

          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-500">
              Host-only rewrite (no bucket listing) if you only changed the public domain and keys
              stayed identical.
            </p>
            <button
              type="button"
              onClick={runHostRewrite}
              disabled={pending}
              className="inline-flex items-center px-3 py-2 text-xs rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 min-h-[44px]"
            >
              Rewrite hosts only
            </button>
            {hostResult && <HostSummary result={hostResult} />}
          </div>
        </div>
      </div>
    </div>
  )
}
