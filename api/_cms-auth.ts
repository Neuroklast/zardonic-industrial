/**
 * CMS authentication helpers.
 * OWASP A01:2021 — Broken Access Control: every CMS endpoint must call validateCmsSession.
 * Reuses the existing session infrastructure from api/auth.ts.
 */

import type { VercelRequest } from '@vercel/node'
import { validateSession } from './auth.js'

/** Validates the admin session for CMS endpoints. Returns true if the session is valid. */
export async function validateCmsSession(req: VercelRequest): Promise<boolean> {
  return validateSession(req)
}
