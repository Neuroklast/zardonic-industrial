import { readBearerToken, verifyCronSecret } from '@/lib/cron-auth'

function resolveOrigin(): string {
  const site = process.env.SITE_URL?.replace(/\/$/, '')
  if (site) return site
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

/** Fire-and-forget next tick for a running sync job (cron secret auth). */
export function chainSyncJobTick(jobId: string): void {
  const secret = process.env.CRON_SECRET
  if (!secret) return

  const url = `${resolveOrigin()}/api/sync-jobs/${jobId}/tick`
  void fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  }).catch((error) => {
    console.error(`[sync-job-chain] Failed to chain tick for ${jobId}:`, error)
  })
}

export function isCronOrAdminAuthorized(request: Request, isAdmin: boolean): boolean {
  const bearer = readBearerToken(request.headers.get('authorization'))
  if (verifyCronSecret(bearer)) return true
  return isAdmin
}