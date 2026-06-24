import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { isCronOrAdminAuthorized } from '@/lib/sync-job-chain'
import { continueSyncJob } from '@/lib/sync-job-continuation'
import { advanceSyncJob } from '@/lib/sync-job-runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await isAdminSession()
  if (!isCronOrAdminAuthorized(request, admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const result = await advanceSyncJob(id)
    if (!result.done && result.job.status === 'running') {
      continueSyncJob(id)
    }

    if (result.done && result.job.status === 'completed') {
      revalidatePath('/admin/releases')
      revalidatePath('/admin/gigs')
      revalidatePath('/')
    }

    return NextResponse.json(
      { job: result.job, done: result.done },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[sync-jobs] tick failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync tick failed' },
      { status: 500 },
    )
  }
}