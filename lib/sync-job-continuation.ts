import { after } from 'next/server'
import { chainSyncJobTick } from '@/lib/sync-job-chain'
import { advanceSyncJob } from '@/lib/sync-job-runner'

/** Schedule the next sync chunk after the HTTP response (no gateway timeout). */
export function continueSyncJob(jobId: string): void {
  try {
    after(async () => {
      try {
        const result = await advanceSyncJob(jobId)
        if (!result.done && result.job.status === 'running') {
          continueSyncJob(jobId)
        }
      } catch (error) {
        console.error(`[sync-job-continuation] tick failed for ${jobId}:`, error)
        chainSyncJobTick(jobId)
      }
    })
  } catch {
    chainSyncJobTick(jobId)
  }
}