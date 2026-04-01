/**
 * Public Biography API — returns the published biography.
 * OWASP A01:2021 — Draft content is never exposed to the public.
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
    const bio = await prisma.biography.findUnique({ where: { id: 'main' } })
    if (!bio || bio.isDraft) return res.status(404).json({ error: 'Not found' })

    // OWASP A01:2021 — Return only the published content, not drafts
    return res.status(200).json({
      content: bio.publishedContent ?? bio.content,
      shortBio: bio.shortBio,
      pressKitUrl: bio.pressKitUrl,
      photoUrls: bio.photoUrls,
      publishedAt: bio.publishedAt,
    })
  } catch (err) {
    console.error('[public/biography]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
