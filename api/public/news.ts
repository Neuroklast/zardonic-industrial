/**
 * Public News API — returns published news posts.
 * OWASP A01:2021 — Draft posts are never exposed to the public.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { applyRateLimit } from '../_ratelimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    const posts = await prisma.newsPost.findMany({
      where: { isDraft: false },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverUrl: true, publishedAt: true, content: true,
      },
    })
    return res.status(200).json(posts)
  } catch (err) {
    console.error('[public/news]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
