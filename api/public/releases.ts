/**
 * Public Releases API — returns published releases only.
 * OWASP A01:2021 — Draft releases are never exposed to the public.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { applyRateLimit } from '../_ratelimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    const releases = await prisma.release.findMany({
      where: { isDraft: false },
      orderBy: [{ sortOrder: 'asc' }, { releaseDate: 'desc' }],
      select: {
        id: true, title: true, type: true, releaseDate: true,
        coverUrl: true, description: true, spotifyUrl: true, appleMusicUrl: true,
        bandcampUrl: true, youtubeUrl: true, soundcloudUrl: true, odesliUrl: true,
        tracks: true, featured: true, publishedAt: true,
      },
    })
    return res.status(200).json(releases)
  } catch (err) {
    console.error('[public/releases]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
