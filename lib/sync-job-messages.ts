import type { SyncJobPhase, SyncJobRow, SyncJobStatus, SyncJobType } from '@/lib/sync-jobs'

const JOB_LABELS: Record<SyncJobType, string> = {
  spotify_sync: 'Spotify import',
  discogs_sync: 'Discogs import',
  itunes_sync: 'iTunes import',
  track_enrichment: 'Track enrichment',
  bandsintown_sync: 'Bandsintown events',
  purge_and_sync_releases: 'Purge + Spotify re-sync',
  purge_and_sync_gigs: 'Purge + Bandsintown re-sync',
}

export function getSyncJobLabel(type: SyncJobType): string {
  return JOB_LABELS[type] ?? type
}

export function getSyncJobProgressPercent(job: SyncJobRow): number | null {
  const { progress, status } = job

  if (status === 'completed') return 100
  if (status === 'failed' || status === 'cancelled') return null
  if (status === 'pending') return 2

  if (progress.total != null && progress.total > 0) {
    return Math.min(99, Math.max(3, Math.round((progress.processed / progress.total) * 100)))
  }

  if (progress.processed > 0) return 35
  return 8
}

function phaseVerb(phase: SyncJobPhase | null): string {
  switch (phase) {
    case 'purge':
      return 'Removing old records'
    case 'fetch':
      return 'Fetching catalogue from API'
    case 'import':
      return 'Importing into database'
    case 'enrich':
      return 'Enriching tracklists & streaming links'
    case 'sync':
      return 'Syncing events'
    default:
      return 'Working'
  }
}

function runningMessage(job: SyncJobRow): string {
  const { type, phase, progress } = job
  const label = getSyncJobLabel(type)
  const verb = phaseVerb(phase)

  if (progress.total != null && progress.total > 0) {
    return `${label}: ${verb}… ${progress.processed} of ${progress.total} processed.`
  }

  if (progress.processed > 0) {
    return `${label}: ${verb}… ${progress.processed} items processed so far.`
  }

  return `${label}: ${verb}…`
}

export function getSyncJobStatusMessage(job: SyncJobRow): string {
  const { status, progress } = job
  const label = getSyncJobLabel(job.type)

  if (status === 'completed') {
    const parts = [
      progress.synced > 0 ? `${progress.synced} imported/enriched` : null,
      progress.updated > 0 ? `${progress.updated} updated` : null,
      progress.skipped > 0 ? `${progress.skipped} skipped` : null,
    ].filter(Boolean)

    return parts.length > 0
      ? `${label} complete — ${parts.join(', ')}.`
      : `${label} complete.`
  }

  if (status === 'failed') {
    return `${label} failed. Check the messages below and try again.`
  }

  if (status === 'cancelled') {
    return `${label} was cancelled.`
  }

  if (status === 'pending') {
    return `${label} is starting…`
  }

  return runningMessage(job)
}

export function getSyncJobStatusHeadline(status: SyncJobStatus): string {
  switch (status) {
    case 'completed':
      return 'Complete'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'running':
      return 'In progress'
    default:
      return 'Starting'
  }
}