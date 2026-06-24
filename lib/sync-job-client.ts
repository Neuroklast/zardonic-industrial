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

export async function cancelSyncJobClient(jobId: string): Promise<void> {
  const res = await fetch(`/api/sync-jobs/${jobId}/cancel`, { method: 'POST' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to cancel sync job')
  }
}