import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { cancelSyncJob } from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const job = await cancelSyncJob(id)
    return NextResponse.json({ job }, { status: 200 })
  } catch (error) {
    console.error('[sync-jobs] cancel failed:', error)
    return NextResponse.json({ error: 'Failed to cancel sync job' }, { status: 500 })
  }
}