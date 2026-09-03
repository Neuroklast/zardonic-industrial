import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { continueSyncJob } from '@/lib/sync-job-continuation'
import { listStaleRunningJobs } from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stale = await listStaleRunningJobs(30_000)
    for (const job of stale) {
      continueSyncJob(job.id)
    }

    return NextResponse.json({ reaped: stale.length, jobIds: stale.map((j) => j.id) })
  } catch (error) {
    console.error('[sync-jobs] reap failed:', error)
    return NextResponse.json({ error: 'Reap failed' }, { status: 500 })
  }
}