import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminUserId, isAdminSession } from '@/lib/api-admin-auth'
import { continueSyncJob } from '@/lib/sync-job-continuation'
import {
  createSyncJob,
  findActiveSyncJobOfType,
  type SyncJobPayload,
  type SyncJobType,
} from '@/lib/sync-jobs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const createJobSchema = z.object({
  type: z.enum([
    'discogs_sync',
    'spotify_sync',
    'itunes_sync',
    'track_enrichment',
    'bandsintown_sync',
    'purge_and_sync_releases',
    'purge_and_sync_gigs',
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
})

function initialPhase(type: SyncJobType): 'purge' | 'fetch' | 'import' | 'enrich' | 'sync' | null {
  if (type === 'purge_and_sync_releases' || type === 'purge_and_sync_gigs') return 'purge'
  if (type === 'track_enrichment') return 'enrich'
  return 'fetch'
}

function initialPayload(type: SyncJobType): Record<string, unknown> {
  if (type === 'discogs_sync') return { source: 'discogs', stagedItems: [], importCursor: 0 }
  if (type === 'spotify_sync') return { source: 'spotify', stagedItems: [], importCursor: 0 }
  if (type === 'itunes_sync') return { source: 'itunes', stagedItems: [], importCursor: 0 }
  if (type === 'track_enrichment') return { enrichCursor: 0 }
  if (type === 'bandsintown_sync') return { gigImportCursor: 0 }
  return {}
}

export async function POST(request: Request) {
  const admin = await isAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    const raw = await request.text()
    // Do not accept enormous client-provided staged catalogues.
    if (raw.length > 8192) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
    }
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createJobSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  try {
    const type = parsed.data.type
    const existing = await findActiveSyncJobOfType(type)
    if (existing) {
      return NextResponse.json({ jobId: existing.id, status: existing.status, reused: true })
    }

    const userId = await getAdminUserId()
    const suppliedPayload = parsed.data.payload ?? {}
    // Processing state is exclusively controlled by the server worker.
    if (['processing', 'processingSince', 'tickCount', 'stagedItems', 'stagedGigs'].some(
      (key) => Object.prototype.hasOwnProperty.call(suppliedPayload, key),
    )) {
      return NextResponse.json({ error: 'Invalid sync job payload' }, { status: 400 })
    }
    const payload = {
      ...initialPayload(type),
      ...suppliedPayload,
    }

    const job = await createSyncJob(type, payload as SyncJobPayload, userId, initialPhase(type))
    continueSyncJob(job.id)

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 201 })
  } catch (error) {
    console.error('[sync-jobs] create failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sync job' },
      { status: 500 },
    )
  }
}