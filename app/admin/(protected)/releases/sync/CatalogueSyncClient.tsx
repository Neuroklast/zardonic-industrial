'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowsClockwise, CalendarBlank, MusicNotes, Trash, Warning } from '@phosphor-icons/react'
import {
  consolidateReleases,
  purgeGigs,
  purgeReleases,
  resetReleaseTracklists,
} from '@/app/admin/_actions/dataMaintenance'
import { SyncJobStatus } from '@/app/admin/_components/SyncJobStatus'
import { CatalogueSyncSettings } from '@/app/admin/_components/CatalogueSyncSettings'
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
import { useSyncJobPoll } from '@/hooks/useSyncJobPoll'
import type { CatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import { startSyncJob } from '@/lib/sync-job-client'
import type { SyncJobRow } from '@/lib/sync-jobs'

type SyncSource = 'itunes' | 'spotify' | 'discogs'

type MaintenanceAction =
  | 'consolidateReleases'
  | 'purgeReleases'
  | 'purgeGigs'
  | 'purgeAndSyncReleases'
  | 'purgeAndSyncGigs'
  | 'resetTracklists'
  | 'enrichTracks'
  | 'bandsintownSync'

const ALL_CATALOGUE_JOB_TYPES = [
  'itunes_sync',
  'spotify_sync',
  'discogs_sync',
  'track_enrichment',
  'bandsintown_sync',
  'purge_and_sync_releases',
  'purge_and_sync_gigs',
] as const

const ACTION_COPY: Record<
  MaintenanceAction,
  { title: string; description: string; confirmLabel: string; destructive?: boolean }
> = {
  consolidateReleases: {
    title: 'Consolidate duplicate releases?',
    description:
      'Merges duplicate catalogue entries by title, release date, and external IDs. Keeps the richest row and fills in missing Spotify/iTunes/Discogs IDs and tracklists.',
    confirmLabel: 'Consolidate duplicates',
  },
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
  bandsintownSync: {
    title: 'Sync events from Bandsintown?',
    description: 'Imports or updates all upcoming and past events without deleting existing gigs first.',
    confirmLabel: 'Start event sync',
  },
}

interface CatalogueSyncClientProps {
  initialConfig: CatalogueSyncConfig
  activeJob?: SyncJobRow | null
  needsEnrichment?: number | null
}

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id?: string
  icon: typeof MusicNotes
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-zinc-400 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function CatalogueSyncClient({
  initialConfig,
  activeJob = null,
  needsEnrichment = null,
}: CatalogueSyncClientProps) {
  const [source, setSource] = useState<SyncSource>('spotify')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openAction, setOpenAction] = useState<MaintenanceAction | null>(null)
  const [pending, startTransition] = useTransition()

  const { job, error: jobError, polling, startPolling } = useSyncJobPoll({
    storageKey: 'catalogue-sync',
    resumeTypes: [...ALL_CATALOGUE_JOB_TYPES],
    initialJobId: activeJob?.id ?? null,
  })

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const jobType =
        source === 'itunes' ? 'itunes_sync' : source === 'spotify' ? 'spotify_sync' : 'discogs_sync'
      const { jobId } = await startSyncJob(jobType)
      startPolling(jobId)
      setMessage(`Started ${source} import — progress below.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import')
    } finally {
      setLoading(false)
    }
  }

  function runAction(action: MaintenanceAction) {
    setMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        switch (action) {
          case 'consolidateReleases': {
            const result = await consolidateReleases()
            if ('error' in result) throw new Error(result.error)
            setMessage(
              result.deleted > 0
                ? `Consolidated ${result.deleted} duplicate release(s).`
                : 'No duplicate releases found.',
            )
            break
          }
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
            setMessage('Purge + Spotify re-sync started — progress below.')
            break
          }
          case 'purgeAndSyncGigs': {
            const { jobId } = await startSyncJob('purge_and_sync_gigs')
            startPolling(jobId)
            setMessage('Purge + Bandsintown re-sync started — progress below.')
            break
          }
          case 'resetTracklists': {
            const result = await resetReleaseTracklists()
            if ('error' in result) throw new Error(result.error)
            setMessage(`Reset tracklists on ${result.deleted} release(s).`)
            break
          }
          case 'enrichTracks': {
            const { jobId } = await startSyncJob('track_enrichment')
            startPolling(jobId)
            setMessage('Track enrichment started — progress below.')
            break
          }
          case 'bandsintownSync': {
            const { jobId } = await startSyncJob('bandsintown_sync')
            startPolling(jobId)
            setMessage('Bandsintown event sync started — progress below.')
            break
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed')
      } finally {
        setOpenAction(null)
      }
    })
  }

  function ActionButton({
    action,
    label,
    icon: Icon,
    variant = 'default',
  }: {
    action: MaintenanceAction
    label: string
    icon: typeof Trash
    variant?: 'default' | 'primary' | 'danger'
  }) {
    const copy = ACTION_COPY[action]
    const baseClass =
      variant === 'primary'
        ? 'bg-red-700 hover:bg-red-600 text-white'
        : variant === 'danger'
          ? 'bg-zinc-900 border border-red-900/60 text-red-200 hover:bg-red-950/40'
          : 'bg-zinc-800 hover:bg-zinc-700 text-white'

    return (
      <AlertDialog open={openAction === action} onOpenChange={(open) => setOpenAction(open ? action : null)}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={pending || polling}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] ${baseClass}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{copy.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runAction(action)}
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              {copy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const descriptions: Record<SyncSource, string> = {
    itunes:
      'Bulk-import releases via iTunes lookup or artist name search. Matches and merges with existing Spotify rows.',
    spotify:
      'Bulk-import albums and singles from the configured Spotify artist. Matches and merges with existing iTunes rows.',
    discogs: 'Bulk-import releases from the configured Discogs artist.',
  }

  const configuredId: Record<SyncSource, string> = {
    itunes: initialConfig.itunesArtistId,
    spotify: initialConfig.spotifyArtistId,
    discogs: initialConfig.discogsArtistId,
  }

  const canImport = Boolean(configuredId[source]) || Boolean(initialConfig.artistName.trim())

  return (
    <div className="max-w-3xl space-y-6">
      <CatalogueSyncSettings initialConfig={initialConfig} />

      {job ? <SyncJobStatus job={job} /> : null}

      {message ? <p className="text-xs text-green-400">{message}</p> : null}
      {error || jobError ? (
        <p className="text-xs text-red-400">{error ?? jobError}</p>
      ) : null}

      <SectionCard
        icon={MusicNotes}
        title="Import catalogue"
        description="Pull releases from a streaming or catalogue platform. Each import runs as a background job with live progress."
      >
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
          <p className="text-xs text-zinc-500 font-mono">Using saved ID: {configuredId[source]}</p>
        ) : (
          <p className="text-xs text-amber-500/90">
            No {source} artist ID saved — import will use artist name “{initialConfig.artistName}” where supported.
          </p>
        )}

        <form onSubmit={handleImport}>
          <button
            type="submit"
            disabled={loading || polling || !canImport}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-900/80 hover:bg-red-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading || polling ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden
                />
                {polling ? 'Job running…' : 'Starting…'}
              </>
            ) : (
              `Import from ${source === 'itunes' ? 'iTunes' : source === 'spotify' ? 'Spotify' : 'Discogs'}`
            )}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        icon={ArrowsClockwise}
        title="Track enrichment"
        description="Fetch missing or stale tracklists and streaming links from external APIs. Manually edited releases are never overwritten."
      >
        {needsEnrichment != null ? (
          <p className="text-xs text-zinc-500 font-mono">
            Releases needing enrichment: {needsEnrichment}
          </p>
        ) : null}
        <ActionButton
          action="enrichTracks"
          label={pending && openAction === 'enrichTracks' ? 'Starting…' : 'Enrich all tracklists'}
          icon={ArrowsClockwise}
          variant="primary"
        />
        <ActionButton action="resetTracklists" label="Reset tracklists" icon={Trash} variant="danger" />
        <ActionButton
          action="consolidateReleases"
          label="Consolidate duplicates"
          icon={ArrowsClockwise}
        />
      </SectionCard>

      <SectionCard
        id="events"
        icon={CalendarBlank}
        title="Events / tour dates"
        description="Sync gigs from Bandsintown into the public Events section."
      >
        <div className="flex flex-wrap gap-2">
          <ActionButton
            action="bandsintownSync"
            label="Sync from Bandsintown"
            icon={ArrowsClockwise}
            variant="primary"
          />
          <ActionButton
            action="purgeAndSyncGigs"
            label="Purge + re-sync gigs"
            icon={Trash}
            variant="danger"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Warning}
        title="Advanced maintenance"
        description="Destructive operations for resetting synced catalogue data. Use with care."
      >
        <div className="flex flex-wrap gap-2">
          <ActionButton
            action="purgeAndSyncReleases"
            label="Purge + re-sync releases"
            icon={Trash}
            variant="danger"
          />
          <ActionButton action="purgeReleases" label="Purge releases" icon={Trash} variant="danger" />
          <ActionButton action="purgeGigs" label="Purge gigs" icon={Trash} variant="danger" />
        </div>
        <p className="text-xs text-zinc-500">
          Export a backup first on{' '}
          <Link href="/admin/data" className="text-zinc-300 underline underline-offset-2 hover:text-white">
            Data Import/Export
          </Link>
          .
        </p>
      </SectionCard>
    </div>
  )
}