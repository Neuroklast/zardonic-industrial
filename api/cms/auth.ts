/**
 * CMS Auth — session check for the CMS dashboard.
 * Delegates to the existing admin auth system in api/auth.ts.
 * OWASP A01:2021 — Broken Access Control
 * OWASP A07:2021 — Identification and Authentication Failures
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateSession } from '../auth.js'
import { applyAuthRateLimit } from '../_ratelimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // OWASP A02:2021 — No sensitive data in responses
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // OWASP A07:2021 — Rate limit session checks
  const allowed = await applyAuthRateLimit(req, res)
  if (!allowed) return

  const valid = await validateSession(req)
  if (!valid) {
    return res.status(401).json({ authenticated: false })
  }

  return res.status(200).json({ authenticated: true })
}
