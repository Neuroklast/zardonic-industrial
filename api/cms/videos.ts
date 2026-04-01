/**
 * CMS Videos API — CRUD for video content.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { videoCreateSchema, videoUpdateSchema } from '../_cms-schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  const { id } = req.query as Record<string, string>

  try {
    if (req.method === 'GET' && !id) {
      const videos = await prisma.video.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
      return res.status(200).json(videos)
    }

    if (req.method === 'GET' && id) {
      const video = await prisma.video.findUnique({ where: { id } })
      if (!video) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(video)
    }

    if (req.method === 'POST') {
      const parsed = validate(videoCreateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const video = await prisma.video.create({ data: parsed.data })
      await logActivity({ action: 'create', entity: 'video', entityId: video.id, req })
      return res.status(201).json(video)
    }

    if (req.method === 'PUT' && id) {
      const parsed = validate(videoUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const video = await prisma.video.update({ where: { id }, data: parsed.data })
      await logActivity({ action: 'update', entity: 'video', entityId: id, req })
      return res.status(200).json(video)
    }

    if (req.method === 'DELETE' && id) {
      await prisma.video.delete({ where: { id } })
      await logActivity({ action: 'delete', entity: 'video', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/videos]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
