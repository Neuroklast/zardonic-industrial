'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Warning, ArrowsClockwise, Trash } from '@phosphor-icons/react'
import { purgeGigs, purgeReleases, resetReleaseTracklists } from '@/app/admin/_actions/dataMaintenance'
import { SyncJobStatus } from '@/app/admin/_components/SyncJobStatus'
import { useSyncJobPoll } from '@/hooks/useSyncJobPoll'
import { startSyncJob } from '@/lib/sync-job-client'
import {
  countReleasesNeedingTrackEnrichment,
  enrichAllReleasesTracks,
} from '@/app/admin/_actions/releaseTrackEnrichment'
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

type MaintenanceAction =
  | 'purgeReleases'
  | 'purgeGigs'
  | 'purgeAndSyncReleases'
  | 'purgeAndSyncGigs'
  | 'resetTracklists'
  | 'enrichTracks'

const ACTION_COPY: Record<
  MaintenanceAction,
  { title: string; description: string; confirmLabel: string; destructive?: boolean }
> = {
  purgeReleases: {
    title: 'Purge auto-synced releases?',
    description:
      'Deletes all releases where manually_edited is false. Manually edited releases are kept.',
    confirmLabel: 'Purge releases',
    destructive: true,
  },
  purgeGigs: {
    title: 'Purge all gigs?',
    description: 'Deletes every gig/event from Supabase. This cannot be undone.',
    confirmLabel: 'Purge gigs',
    destructive: true,
  },
  purgeAndSyncReleases: {
    title: 'Purge releases and re-sync?',
    description:
      'Removes auto-synced releases, imports the Spotify catalogue, then enriches tracklists in batches.',
    confirmLabel: 'Purge + sync releases',
    destructive: true,
  },
  purgeAndSyncGigs: {
    title: 'Purge gigs and re-sync?',
    description: 'Deletes all gigs, then runs a fresh Bandsintown sync.',
    confirmLabel: 'Purge + sync gigs',
    destructive: true,
  },
  resetTracklists: {
    title: 'Reset tracklists?',
    description:
      'Clears tracks for all non-manual releases so they can be re-fetched from Spotify/Discogs/iTunes.',
    confirmLabel: 'Reset tracklists',
    destructive: true,
  },
  enrichTracks: {
    title: 'Enrich all release tracklists?',
    description:
      'Fetches missing or stale tracklists from Spotify (preferred), Discogs, or iTunes. Skips manually edited releases.',
    confirmLabel: 'Start enrichment',
  },
}

function StatusMessage({ message, error }: { message: string | null; error: string | null }) {
  if (error) return <p className="text-xs text-red-400 mt-2">{error}</p>
  if (message) return <p className="text-xs text-green-400 mt-2">{message}</p>
  return null
}

export function DataMaintenanceClient() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsEnrichment, setNeedsEnrichment] = useState<number | null>(null)
  const [enrichProgress, setEnrichProgress] = useState<string | null>(null)
  const [openAction, setOpenAction] = useState<MaintenanceAction | null>(null)
  const { job: syncJob, error: syncJobError, polling: syncJobPolling, startPolling } = useSyncJobPoll()

  const refreshEnrichmentCount = useCallback(async () => {
    const result = await countReleasesNeedingTrackEnrichment()
    if ('count' in result) setNeedsEnrichment(result.count)
  }, [])

  useEffect(() => {
    void refreshEnrichmentCount()
  }, [refreshEnrichmentCount])

  async function runEnrichmentLoop() {
    let totalEnriched = 0
    let totalSkipped = 0
    const allErrors: string[] = []
    let remaining = 1

    while (remaining > 0) {
      const batch = await enrichAllReleasesTracks({ limit: 25 })
      if ('error' in batch) throw new Error(batch.error)

      totalEnriched += batch.enriched
      totalSkipped += batch.skipped
      allErrors.push(...batch.errors)
      remaining = batch.remaining

      setEnrichProgress(
        `Enriched ${totalEnriched} · skipped ${totalSkipped} · ${remaining} remaining…`,
      )
    }

    return { totalEnriched, totalSkipped, allErrors }
  }

  function runAction(action: MaintenanceAction) {
    setMessage(null)
    setError(null)
    setEnrichProgress(null)

    startTransition(async () => {
      try {
        switch (action) {
          case 'purgeReleases': {
            const result = await purgeReleases()
            if ('error' in result) throw new Error(result.error)
            setMessage(`Purged ${result.deleted} auto-synced release(s).`)
            break
          }
          case 'purgeGigs': {
            const result = await purgeGigs()
            if ('error' in result) throw new Error(result.error)
            setMessage(`Purged ${result.deleted} gig(s).`)
            break
          }
          case 'purgeAndSyncReleases': {
            const { jobId } = await startSyncJob('purge_and_sync_releases')
            startPolling(jobId)
            setMessage('Purge + Spotify sync job started — progress below.')
            break
          }
          case 'purgeAndSyncGigs': {
            const { jobId } = await startSyncJob('purge_and_sync_gigs')
            startPolling(jobId)
            setMessage('Purge + Bandsintown sync job started — progress below.')
            break
          }
          case 'resetTracklists': {
            const result = await resetReleaseTracklists()
            if ('error' in result) throw new Error(result.error)
            setMessage(`Reset tracklists on ${result.deleted} release(s).`)
            break
          }
          case 'enrichTracks': {
            const summary = await runEnrichmentLoop()
            setMessage(
              `Track enrichment complete — ${summary.totalEnriched} updated, ${summary.totalSkipped} skipped.`,
            )
            if (summary.allErrors.length > 0) {
              setError(summary.allErrors.slice(0, 5).join(' · '))
            }
            break
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed')
      } finally {
        setOpenAction(null)
        void refreshEnrichmentCount()
      }
    })
  }

  function MaintenanceButton({
    action,
    label,
    icon: Icon,
    variant = 'default',
  }: {
    action: MaintenanceAction
    label: string
    icon: typeof Trash
    variant?: 'default' | 'primary'
  }) {
    const copy = ACTION_COPY[action]
    const baseClass =
      variant === 'primary'
        ? 'bg-red-700 hover:bg-red-600 text-white'
        : 'bg-zinc-800 hover:bg-zinc-700 text-white'

    return (
      <AlertDialog
        open={openAction === action}
        onOpenChange={(open) => setOpenAction(open ? action : null)}
      >
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={pending || syncJobPolling}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] ${baseClass}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{copy.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {copy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runAction(action)}
              className={
                copy.destructive
                  ? 'bg-red-700 hover:bg-red-600 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'
              }
            >
              {copy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Warning className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-white">Data Maintenance</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Purge synced data, reset tracklists, or re-fetch tracklists from Spotify / Discogs / iTunes.
            Manually edited releases are never overwritten.
          </p>
          {needsEnrichment !== null && (
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              Releases needing track enrichment: {needsEnrichment}
            </p>
          )}
          {enrichProgress && <p className="text-xs text-zinc-400 mt-1 font-mono">{enrichProgress}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <MaintenanceButton
          action="enrichTracks"
          label={pending && openAction === 'enrichTracks' ? 'Enriching…' : 'Enrich all tracklists'}
          icon={ArrowsClockwise}
          variant="primary"
        />
        <MaintenanceButton action="resetTracklists" label="Reset tracklists" icon={Trash} />
        <MaintenanceButton action="purgeAndSyncReleases" label="Purge + sync releases" icon={Trash} />
        <MaintenanceButton action="purgeReleases" label="Purge releases" icon={Trash} />
        <MaintenanceButton action="purgeAndSyncGigs" label="Purge + sync gigs" icon={Trash} />
        <MaintenanceButton action="purgeGigs" label="Purge gigs" icon={Trash} />
      </div>

      <StatusMessage message={message} error={error ?? syncJobError} />

      {syncJob && <SyncJobStatus job={syncJob} />}
    </div>
  )
}