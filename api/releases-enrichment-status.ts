/**
 * GET /api/releases-enrichment-status
 *
 * Returns:
 *   - `total`: total releases in band-data
 *   - `pendingCount`: releases still waiting in the enrichment queue
 *   - `pending`: summary of pending queue items (id + title)
 *
 * Reads the live `releases-enrich-queue` key so the admin dashboard shows
 * real progress instead of the placeholder zeros that existed before.
 *
 * Requires a valid admin session.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getRedisOrNull, isRedisConfigured } from './_redis.js'
import { validateSession } from './auth.js'

const BAND_DATA_KEY = 'band-data'
const QUEUE_KEY = 'releases-enrich-queue'

interface Release {
  id: string
  title: string
  [key: string]: unknown
}

interface SiteData {
  releases?: Release[]
  [key: string]: unknown
}

interface EnrichQueue {
  releases: Release[]
  processedCount: number
  [key: string]: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return }

  const sessionValid = await validateSession(req)
  if (!sessionValid) { res.status(401).json({ error: 'Unauthorized' }); return }

  if (!isRedisConfigured()) {
    res.status(503).json({ error: 'Redis not configured' }); return
  }

  const redis = getRedisOrNull()!

  const [siteData, queue] = await Promise.all([
    redis.get<SiteData>(BAND_DATA_KEY),
    redis.get<EnrichQueue>(QUEUE_KEY),
  ])

  const releases: Release[] = siteData?.releases ?? []
  const total = releases.length

  // Derive pending releases from the live queue (releases not yet processed)
  let pendingCount = 0
  let pending: Array<{ id: string; title: string }> = []
  if (queue && Array.isArray(queue.releases)) {
    const processed = typeof queue.processedCount === 'number' ? queue.processedCount : 0
    const remaining = queue.releases.slice(processed)
    pendingCount = remaining.length
    pending = remaining.map(r => ({ id: r.id, title: r.title }))
  }

  res.status(200).json({ total, pendingCount, pending })
}
