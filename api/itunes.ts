import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyRateLimit } from './_ratelimit.js'
import { fetchWithRetry } from './_fetch-retry.js'
import { validate, itunesQuerySchema } from './_schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limiting
  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  // Validate query parameters
  const parsed = validate(itunesQuerySchema, req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error })
  }

  const { term, entity, limit } = parsed.data

  const params = new URLSearchParams({ term })
  if (entity && entity !== 'all') params.set('entity', entity)
  if (limit) params.set('limit', String(limit))

  try {
    const response = await fetchWithRetry(
      `https://itunes.apple.com/search?${params.toString()}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: `iTunes API responded with ${response.status}` })
    }

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('iTunes proxy error:', error)
    res.status(502).json({ error: 'Failed to fetch from iTunes API' })
  }
}
