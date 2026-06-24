import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { getSyncJob } from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const job = await getSyncJob(id)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    return NextResponse.json({ job }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[sync-jobs] get failed:', error)
    return NextResponse.json({ error: 'Failed to load sync job' }, { status: 500 })
  }
}