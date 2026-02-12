import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { artist, app_id } = req.query

  if (!artist || typeof artist !== 'string') {
    return res.status(400).json({ error: 'Missing artist parameter' })
  }

  const params = new URLSearchParams()
  if (app_id && typeof app_id === 'string') params.set('app_id', app_id)

  try {
    const response = await fetch(
      `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?${params.toString()}`
    )

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Bandsintown proxy error:', error)
    res.status(502).json({ error: 'Failed to fetch from Bandsintown API' })
  }
}
