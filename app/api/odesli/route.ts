import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/api-admin-auth'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { odesliEnrichPostSchema, odesliQuerySchema } from '@/api/_schemas'
import { fetchOdesliLinksFromApi, ODESLI_DEFAULT_COUNTRY } from '@/lib/odesli'
import { runStreamingEnrichmentBatch } from '@/lib/release-enrichment'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { namespace: 'odesli', limit: 20, windowSeconds: 60 } as const

async function guard(request: Request): Promise<NextResponse | null> {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fail-closed: reject when the limiter itself is unavailable.
  try {
    const rl = await consumeRateLimitForRequest(request, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
  } catch (err) {
    console.warn('[odesli] rate limit unavailable, rejecting (fail-closed):', err)
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  return null
}

/**
 * GET /api/odesli?url=&userCountry=
 * Single Odesli (song.link) lookup — resolves one streaming URL to every
 * platform link Odesli knows for the same release/track.
 */
export async function GET(request: Request) {
  const denied = await guard(request)
  if (denied) return denied

  const parsed = odesliQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, { status: 400 })
  }

  try {
    const result = await fetchOdesliLinksFromApi(
      parsed.data.url,
      parsed.data.userCountry ?? ODESLI_DEFAULT_COUNTRY,
    )
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[odesli] lookup failed:', error)
    return NextResponse.json({ error: 'Odesli lookup failed' }, { status: 502 })
  }
}

/**
 * POST /api/odesli
 * Streaming-only enrichment batch: walks the non-manual catalogue in a stable
 * order and merges Odesli platform links into `streaming_links`. Call
 * repeatedly (advancing `cursor`) until `done` is true.
 */
export async function POST(request: Request) {
  const denied = await guard(request)
  if (denied) return denied

  let body: unknown = {}
  try {
    const text = await request.text()
    body = text.trim() ? JSON.parse(text) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = odesliEnrichPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const result = await runStreamingEnrichmentBatch(supabase, parsed.data)
    return NextResponse.json(
      {
        ...result,
        remaining: Math.max(0, result.total - result.nextCursor),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[odesli] enrichment batch failed:', error)
    return NextResponse.json({ error: 'Streaming enrichment failed' }, { status: 500 })
  }
}
