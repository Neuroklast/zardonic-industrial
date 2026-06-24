import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { listActiveSyncJobs, type SyncJobType } from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'

const ACTIVE_TYPES: SyncJobType[] = [
  'discogs_sync',
  'spotify_sync',
  'itunes_sync',
  'track_enrichment',
  'bandsintown_sync',
  'purge_and_sync_releases',
  'purge_and_sync_gigs',
]

export async function GET(request: Request) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const typesParam = url.searchParams.get('types')
  let types: SyncJobType[] | undefined

  if (typesParam) {
    const requested = typesParam.split(',').map((value) => value.trim()).filter(Boolean)
    const invalid = requested.filter((value) => !ACTIVE_TYPES.includes(value as SyncJobType))
    if (invalid.length > 0) {
      return NextResponse.json({ error: 'Invalid types parameter' }, { status: 400 })
    }
    types = requested as SyncJobType[]
  }

  try {
    const jobs = await listActiveSyncJobs(types)
    return NextResponse.json({ jobs }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[sync-jobs] active list failed:', error)
    return NextResponse.json({ error: 'Failed to list active sync jobs' }, { status: 500 })
  }
}