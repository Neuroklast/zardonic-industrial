import { after } from 'next/server'
import { chainSyncJobTick } from '@/lib/sync-job-chain'
import { advanceSyncJob } from '@/lib/sync-job-runner'
import { shouldContinueSyncJob } from '@/lib/sync-job-scheduling'

/**
 * Advance one chunk after the response, then hand off at most one follow-up
 * request. Never recursively schedule `after()` on a busy lock or an error.
 * A stuck job can be resumed explicitly via the admin reaper.
 */
export function continueSyncJob(jobId: string): void {
  try {
    after(async () => {
      try {
        const result = await advanceSyncJob(jobId)
        if (shouldContinueSyncJob(result)) {
          await chainSyncJobTick(jobId)
        }
      } catch (error) {
        console.error(`[sync-job-continuation] tick failed for ${jobId}:`, error)
        // No immediate retry here: repeated errors previously caused a
        // runaway loop of PostgREST requests and excessive egress.
      }
    })
  } catch (error) {
    console.error(`[sync-job-continuation] after() unavailable for ${jobId}:`, error)
    // One HTTP fallback, never a recursive retry on failure.
    void chainSyncJobTick(jobId)
  }
}
