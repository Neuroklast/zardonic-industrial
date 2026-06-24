import { NextResponse } from 'next/server'
import { readBearerToken, verifyCronSecret } from '@/lib/cron-auth'
import { chainSyncJobTick } from '@/lib/sync-job-chain'
import { listStaleRunningJobs } from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const bearer = readBearerToken(request.headers.get('authorization'))
  if (!verifyCronSecret(bearer)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stale = await listStaleRunningJobs(30_000)
    for (const job of stale) {
      chainSyncJobTick(job.id)
    }

    return NextResponse.json({ reaped: stale.length, jobIds: stale.map((j) => j.id) })
  } catch (error) {
    console.error('[sync-jobs] reap failed:', error)
    return NextResponse.json({ error: 'Reap failed' }, { status: 500 })
  }
}