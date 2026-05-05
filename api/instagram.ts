/**
 * GET /api/instagram?token=<access_token>[&limit=12]
 *
 * Server-side proxy for the Instagram Basic Display API.
 * Fetches the user's media and returns image URLs.
 *
 * The access token is read from the request query param (set by the admin),
 * never hard-coded. The token is only used server-side and not stored.
 *
 * Returns:
 *   200 { images: string[] }  — array of image URLs (up to `limit`)
 *   400 { error: string }     — missing / invalid params
 *   401 { error: string }     — invalid or expired token
 *   500 { error: string }     — upstream failure
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyRateLimit } from './_ratelimit.js'

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit: shared global rate limiter (30 req / 60 s per IP)
  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const token = typeof req.query.token === 'string' ? req.query.token.trim() : ''
  if (!token) {
    return res.status(400).json({ error: 'Missing required parameter: token' })
  }

  const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 12
  const limit = Math.max(1, Math.min(50, isNaN(rawLimit) ? 12 : rawLimit))

  try {
    // Fetch media IDs and captions from the Instagram Basic Display API
    const fields = 'id,media_type,media_url,thumbnail_url,permalink'
    const apiUrl = `${INSTAGRAM_GRAPH_URL}/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'ZardonicIndustrial/1.0' },
    })

    if (response.status === 401 || response.status === 400) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>
      const msg = (body as { error?: { message?: string } }).error?.message ?? 'Invalid or expired access token'
      return res.status(401).json({ error: msg })
    }

    if (!response.ok) {
      return res.status(502).json({ error: `Instagram API error: ${response.status}` })
    }

    const data = await response.json() as {
      data?: Array<{
        id: string
        media_type: string
        media_url?: string
        thumbnail_url?: string
        permalink?: string
      }>
    }

    const images: string[] = (data.data ?? [])
      .filter(item => item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM')
      .map(item => item.media_url ?? '')
      .filter(Boolean)

    // Cache for 5 minutes to reduce API calls
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ images })
  } catch (err) {
    console.error('[Instagram API] Unexpected error:', err)
    return res.status(500).json({ error: 'Failed to fetch Instagram feed' })
  }
}
