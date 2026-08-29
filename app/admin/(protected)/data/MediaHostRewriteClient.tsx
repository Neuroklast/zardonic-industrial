'use client'

import { useState, useTransition } from 'react'
import { ArrowsClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import {
  applyMediaHostRewriteAction,
  previewMediaHostRewrite,
  type RewriteMediaHostsResult,
} from '@/app/admin/_actions/rewriteMediaHosts'
import type { MediaHostRewriteResult } from '@/lib/r2-url-rewrite'
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

function isErrorResult(result: RewriteMediaHostsResult): result is { error: string } {
  return 'error' in result
}

function Summary({ result }: { result: MediaHostRewriteResult }) {
  const tables = Object.entries(result.byTable)
  return (
    <div className="space-y-2 text-xs">
      <p className="font-mono text-zinc-300">
        Target host: <span className="text-white">{result.publicHost}</span>
        {result.dryRun ? ' (preview)' : ''}
      </p>
      <p className="text-zinc-400">
        Scanned {result.scannedRows} rows · {result.rewrittenRows} would change ·{' '}
        {result.replacements} URL{result.replacements === 1 ? '' : 's'}
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
    </div>
  )
}

export function MediaHostRewriteClient() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaHostRewriteResult | null>(null)
  const [applied, setApplied] = useState<MediaHostRewriteResult | null>(null)

  function runPreview() {
    setError(null)
    setApplied(null)
    startTransition(async () => {
      const result = await previewMediaHostRewrite()
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
      const result = await applyMediaHostRewriteAction()
      if (isErrorResult(result)) {
        setError(result.error)
        return
      }
      setApplied(result)
      setPreview(result)
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <ArrowsClockwise className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Rewrite media URLs to current R2</h2>
            <p className="text-xs text-zinc-400 mt-1">
              After a bucket migration, stored <code className="text-zinc-300">*.r2.dev</code> and{' '}
              <code className="text-zinc-300">wsrv.nl/?url=…</code> still point at the old public host
              (e.g. partner logos). This rewrites them to <code className="text-zinc-300">R2_PUBLIC_HOST</code>.
              Files are not copied. Export JSON first.
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
              Preview
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={pending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-red-900/80 hover:bg-red-800 text-white font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Rewrite now
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Rewrite all media hosts?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Updates every stored R2 / wsrv URL to the current{' '}
                    <code className="text-zinc-300">R2_PUBLIC_HOST</code>. Does not upload or delete
                    files. Download a JSON export first if you have not already.
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
                    Rewrite URLs
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
              Rewrote {applied.replacements} URL{applied.replacements === 1 ? '' : 's'} in{' '}
              {applied.rewrittenRows} row{applied.rewrittenRows === 1 ? '' : 's'}. Hard-refresh the
              public site.
            </p>
          )}

          {preview && <Summary result={preview} />}
        </div>
      </div>
    </div>
  )
}
