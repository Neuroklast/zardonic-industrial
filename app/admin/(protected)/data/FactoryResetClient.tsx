'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Warning, DownloadSimple } from '@phosphor-icons/react'
import { factoryReset, type FactoryResetActionResult } from '@/app/admin/_actions/factoryReset'
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
import { FACTORY_RESET_CONFIRM } from '@/lib/factory-reset'

function isErrorResult(
  result: FactoryResetActionResult | { error: string },
): result is { error: string } {
  return 'error' in result || !('deleted' in result)
}

export function FactoryResetClient() {
  const [phrase, setPhrase] = useState('')
  const [acknowledgeBackup, setAcknowledgeBackup] = useState(false)
  const [deleteR2Media, setDeleteR2Media] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const armed = phrase === FACTORY_RESET_CONFIRM && acknowledgeBackup

  function run() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      try {
        const result = await factoryReset({ confirm: phrase, deleteR2Media })
        if (isErrorResult(result)) throw new Error(result.error)
        const total = Object.values(result.deleted).reduce((a, b) => a + b, 0)
        setMessage(
          `Factory reset complete. Deleted ${total} record(s), re-seeded ${
            result.seededCount
          } config key(s).${
            result.skips.length > 0 ? ` Warnings: ${result.skips.join('; ')}` : ''
          }`,
        )
        setPhrase('')
        setAcknowledgeBackup(false)
        setDeleteR2Media(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Factory reset failed')
      } finally {
        setOpen(false)
      }
    })
  }

  return (
    <div className="border border-red-900/50 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Warning className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-red-300">Factory Reset</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Wipes <span className="text-zinc-200">all</span> editable site content (releases, gigs,
            gallery, news, partners, merch, soundpacks, media downloads, bio, social links) and
            restores the default Look &amp; Feel / content settings. This <span className="text-red-300">cannot be undone</span>.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950/40 p-3">
        <label className="block text-xs text-zinc-400">
          Safety steps <span className="text-red-400">required</span> before you can reset:
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={acknowledgeBackup}
              onChange={(e) => setAcknowledgeBackup(e.target.checked)}
              className="size-4 border-zinc-600 text-red-500"
            />
            I have downloaded a current backup first.
          </label>
          <div>
            <Link
              href="/admin/data/export"
              download
              className="inline-flex items-center gap-1.5 text-xs text-red-300 underline underline-offset-2 hover:text-red-200"
            >
              <DownloadSimple className="h-3.5 w-3.5" aria-hidden />
              Download JSON backup
            </Link>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-zinc-400" htmlFor="fr-phrase">
            Type <code className="text-red-300">{FACTORY_RESET_CONFIRM}</code> to arm:
          </label>
          <input
            id="fr-phrase"
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            placeholder={FACTORY_RESET_CONFIRM}
            className="w-full font-mono text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-200"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={deleteR2Media}
            onChange={(e) => setDeleteR2Media(e.target.checked)}
            className="size-4 border-zinc-600 text-red-500 mt-0.5"
          />
          <span>
            Also delete <span className="text-zinc-200">all files</span> from the R2 bucket. Only tick
            this if you want to purge uploaded media too.
          </span>
        </label>
      </div>

      {message ? <p className="text-xs text-green-400">{message}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={!armed || pending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-red-900/80 hover:bg-red-800 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {pending ? 'Resetting…' : 'Factory reset'}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-zinc-900 border-red-900/60 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-300">Irreversible: run factory reset?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-2">
              <p>
                This deletes every content record and restores default settings
                {deleteR2Media ? ' and deletes all R2 media files' : ''}. It cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={run}
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              Wipe and reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-xs text-zinc-500">
        Preserved: Supabase secrets, newsletter subscribers, analytics events, sync jobs, and the R2
        reconcile marker.
      </p>
    </div>
  )
}
