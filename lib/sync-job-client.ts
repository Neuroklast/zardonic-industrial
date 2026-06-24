import type { SyncJobRow, SyncJobType } from '@/lib/sync-jobs'

export async function startSyncJob(
  type: SyncJobType,
  payload?: Record<string, unknown>,
): Promise<{ jobId: string }> {
  const res = await fetch('/api/sync-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
    cache: 'no-store',
  })

  const data = (await res.json()) as { jobId?: string; error?: string }
  if (!res.ok || !data.jobId) {
    throw new Error(data.error ?? 'Failed to start sync job')
  }
  return { jobId: data.jobId }
}

export async function fetchSyncJob(jobId: string): Promise<SyncJobRow> {
  const res = await fetch(`/api/sync-jobs/${jobId}`, { cache: 'no-store' })
  const data = (await res.json()) as { job?: SyncJobRow; error?: string }
  if (!res.ok || !data.job) {
    throw new Error(data.error ?? 'Failed to load sync job')
  }
  return data.job
}

export async function fetchActiveSyncJobs(types?: SyncJobType[]): Promise<SyncJobRow[]> {
  const query = types && types.length > 0 ? `?types=${types.join(',')}` : ''
  const res = await fetch(`/api/sync-jobs/active${query}`, { cache: 'no-store' })
  const data = (await res.json()) as { jobs?: SyncJobRow[]; error?: string }
  if (!res.ok || !data.jobs) {
    throw new Error(data.error ?? 'Failed to load active sync jobs')
  }
  return data.jobs
}

/** Nudge the worker to process the next chunk (admin session auth). */
export async function triggerSyncJobTick(jobId: string): Promise<void> {
  const res = await fetch(`/api/sync-jobs/${jobId}/tick`, { method: 'POST', cache: 'no-store' })
  if (!res.ok && res.status !== 409) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to advance sync job')
  }
}

export async function cancelSyncJobClient(jobId: string): Promise<void> {
  const res = await fetch(`/api/sync-jobs/${jobId}/cancel`, { method: 'POST' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to cancel sync job')
  }
}