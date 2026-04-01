/**
 * CMS Releases API — CRUD for discography.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { releaseCreateSchema, releaseUpdateSchema } from '../_cms-schemas.js'

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
      const releases = await prisma.release.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
      return res.status(200).json(releases)
    }

    if (req.method === 'GET' && id) {
      const release = await prisma.release.findUnique({ where: { id } })
      if (!release) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(release)
    }

    if (req.method === 'POST') {
      const parsed = validate(releaseCreateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const data = {
        ...parsed.data,
        releaseDate: parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : null,
        tracks: (parsed.data.tracks ?? []) as object[],
      }
      const release = await prisma.release.create({ data })
      await logActivity({ action: 'create', entity: 'release', entityId: release.id, req })
      return res.status(201).json(release)
    }

    if (req.method === 'PUT' && id) {
      const parsed = validate(releaseUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const data: Record<string, unknown> = { ...parsed.data }
      if (parsed.data.releaseDate !== undefined) {
        data['releaseDate'] = parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : null
      }
      const release = await prisma.release.update({ where: { id }, data })
      await logActivity({ action: 'update', entity: 'release', entityId: id, req })
      return res.status(200).json(release)
    }

    if (req.method === 'DELETE' && id) {
      await prisma.release.delete({ where: { id } })
      await logActivity({ action: 'delete', entity: 'release', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/releases]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
