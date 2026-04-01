/**
 * CMS Sections API — CRUD + reordering of homepage sections.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Prisma } from '@prisma/client'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { sectionCreateSchema, sectionUpdateSchema, sectionsReorderSchema } from '../_cms-schemas.js'

type SectionCreateData = Prisma.SectionCreateInput
type SectionUpdateData = Prisma.SectionUpdateInput

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
    // GET /api/cms/sections — list all
    if (req.method === 'GET' && !id) {
      const sections = await prisma.section.findMany({ orderBy: { sortOrder: 'asc' } })
      return res.status(200).json(sections)
    }

    // GET /api/cms/sections?id=xxx — single section
    if (req.method === 'GET' && id) {
      const section = await prisma.section.findUnique({ where: { id } })
      if (!section) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(section)
    }

    // POST /api/cms/sections — create
    if (req.method === 'POST') {
      const parsed = validate(sectionCreateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const section = await prisma.section.create({ data: parsed.data as SectionCreateData })
      await logActivity({ action: 'create', entity: 'section', entityId: section.id, req })
      return res.status(201).json(section)
    }

    // PUT /api/cms/sections?id=xxx — update
    if (req.method === 'PUT' && id) {
      const parsed = validate(sectionUpdateSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      const section = await prisma.section.update({ where: { id }, data: parsed.data as SectionUpdateData })
      await logActivity({ action: 'update', entity: 'section', entityId: id, req })
      return res.status(200).json(section)
    }

    // PUT /api/cms/sections?action=reorder — bulk reorder
    if (req.method === 'PUT' && req.query['action'] === 'reorder') {
      const parsed = validate(sectionsReorderSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })
      await prisma.$transaction(
        parsed.data.order.map(({ id: sectionId, sortOrder }) =>
          prisma.section.update({ where: { id: sectionId }, data: { sortOrder } })
        )
      )
      await logActivity({ action: 'reorder', entity: 'section', req })
      return res.status(200).json({ ok: true })
    }

    // DELETE /api/cms/sections?id=xxx
    if (req.method === 'DELETE' && id) {
      await prisma.section.delete({ where: { id } })
      await logActivity({ action: 'delete', entity: 'section', entityId: id, req })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[cms/sections]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
