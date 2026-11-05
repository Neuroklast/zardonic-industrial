/**
 * The worker that owns the processing lease is responsible for continuing.
 * A duplicate request must never start a second continuation chain.
 */
export function shouldContinueSyncJob(result: {
  done: boolean
  busy?: boolean
  job: { status: string }
}): boolean {
  return !result.done && result.busy !== true && result.job.status === 'running'
}
