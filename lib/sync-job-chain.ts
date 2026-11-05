import { readBearerToken, verifyCronSecret } from '@/lib/cron-auth'

function resolveOrigin(): string {
  const site = process.env.SITE_URL?.replace(/\/$/, '')
  if (site) return site
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

/** Hand off a single chunk to the next request, without automatic retries. */
export async function chainSyncJobTick(jobId: string): Promise<void> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn(`[sync-job-chain] CRON_SECRET missing — cannot HTTP-chain job ${jobId}`)
    return
  }

  const url = `${resolveOrigin()}/api/sync-jobs/${jobId}/tick`
  try {
    // Await the handoff so the serverless runtime does not discard it.
    // Network or server failures are logged, not retried in a hot loop.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    })
    if (!response.ok && response.status !== 409) {
      console.error(`[sync-job-chain] Tick returned HTTP ${response.status} for ${jobId}`)
    }
  } catch (error) {
    console.error(`[sync-job-chain] Failed to chain tick for ${jobId}:`, error)
  }
}

export async function isCronOrAdminAuthorized(
  request: Request,
  checkAdmin: () => Promise<boolean>,
): Promise<boolean> {
  const bearer = readBearerToken(request.headers.get('authorization'))
  if (verifyCronSecret(bearer)) return true
  // A valid cron bearer must not trigger an unnecessary Supabase Auth lookup.
  return checkAdmin()
}