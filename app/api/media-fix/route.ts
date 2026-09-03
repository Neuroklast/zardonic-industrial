import { NextResponse } from 'next/server'
import { canonicalizeR2MediaUrl } from '@/lib/r2-url-rewrite'
import { extractStoredObjectPath } from '@/lib/r2-url-rewrite'
import { buildR2Inventory, listAllR2ObjectKeys, matchInventoryKey } from '@/lib/r2-inventory'
import { currentR2PublicOrigin } from '@/lib/r2-url-rewrite'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 60_000
let cachedBucket = ''
let cachedHost = ''
let cachedAt = 0
let cachedKeys: readonly string[] | null = null

/**
 * Read-only, same-origin helper used by the client's `<img onError>` fallback.
 *
 * When an R2 image 404s (e.g. the DB still points at a stale key/host after a
 * bucket move), this looks the object up in the live bucket by content hash
 * first, then by filename, and returns the corrected public URL if it exists
 * elsewhere. It never writes the DB (the deploy/cron reconcile persists the
 * fix) and it never fetches an arbitrary host — it only ever builds a URL on
 * the current R2 public origin.
 *
 * GET /api/media-fix?path=<objectPath>
 * → { ok: true, url }       corrected URL (only if it differs from the stored path)
 * → { ok: true, url: null } no better match found
 * → { ok: false, error }    R2 env incomplete / lookup failed
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path')
  if (!path) return NextResponse.json({ ok: false, error: 'Missing path' }, { status: 400 })

  // Bound the bucket-listing cost and slow object-existence probing.
  try {
    const rl = await consumeRateLimitForRequest(request, {
      namespace: 'media-fix',
      limit: 90,
      windowSeconds: 60,
    })
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'Rate limited' }, { status: 429 })
    }
  } catch (err) {
    console.warn('[media-fix] rate limit unavailable, rejecting (fail-closed):', err)
    return NextResponse.json({ ok: false, error: 'Rate limited' }, { status: 429 })
  }

  const publicHost = currentR2PublicOrigin()
  const bucket = process.env.R2_BUCKET_MEDIA
  if (!publicHost || !bucket) {
    return NextResponse.json({ ok: false, error: 'R2 not configured' }, { status: 503 })
  }

  const canonical = canonicalizeR2MediaUrl(path)
  const storedPath = extractStoredObjectPath(canonical, bucket)
  if (!storedPath) return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 })

  try {
    // Reuse a short-lived listing so a burst of 404s doesn't re-list the bucket.
    const now = Date.now()
    if (!cachedKeys || cachedBucket !== bucket || cachedHost !== publicHost || now - cachedAt > CACHE_TTL_MS) {
      cachedKeys = await listAllR2ObjectKeys({ bucket })
      cachedBucket = bucket
      cachedHost = publicHost
      cachedAt = now
    }

    const inventory = buildR2Inventory(cachedKeys)
    const match = matchInventoryKey(storedPath, inventory)
    if (match.status !== 'matched' || match.key === storedPath) {
      return NextResponse.json({ ok: true, url: null })
    }

    return NextResponse.json({ ok: true, url: `${publicHost.replace(/\/$/, '')}/${match.key}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Media lookup failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
