/**
 * CMS Site Config API — GET/PUT site-wide configuration.
 * OWASP A01:2021 — Access Control: admin session required.
 * OWASP A03:2021 — Injection: Zod validation on all inputs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_prisma.js'
import { validateSession } from '../auth.js'
import { applyRateLimit } from '../_ratelimit.js'
import { logActivity } from '../_activity-log.js'
import { validate } from '../_schemas.js'
import { siteConfigSchema } from '../_cms-schemas.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff') // OWASP A05:2021
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // OWASP A01:2021 — Verify admin session before any operation
  const authenticated = await validateSession(req)
  if (!authenticated) return res.status(401).json({ error: 'Unauthorized' })

  // OWASP A07:2021 — Rate limiting
  const allowed = await applyRateLimit(req, res)
  if (!allowed) return

  try {
    if (req.method === 'GET') {
      const config = await prisma.siteConfig.upsert({
        where: { id: 'main' },
        update: {},
        create: { id: 'main' },
      })
      return res.status(200).json(config)
    }

    if (req.method === 'PUT') {
      // OWASP A03:2021 — Input validation
      const parsed = validate(siteConfigSchema, req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error })

      const config = await prisma.siteConfig.upsert({
        where: { id: 'main' },
        update: { ...parsed.data, updatedAt: new Date() },
        create: { id: 'main', ...parsed.data },
      })

      await logActivity({ action: 'update', entity: 'siteConfig', entityId: 'main', req })
      return res.status(200).json(config)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    // OWASP A09:2021 — Log errors, but never leak internals
    console.error('[cms/site-config]', err instanceof Error ? err.message : 'unknown error')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
