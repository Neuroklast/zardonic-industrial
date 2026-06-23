/**
 * LEGACY MIGRATION ARTIFACT
 * This file is from the pre-App-Router / Redis-based admin auth.
 * Current admin auth is Supabase-only via /admin/login/submit/route.ts .
 * Only kept for backward compat in some tests/scripts.
 */
import { randomBytes, scrypt as nodeScrypt } from 'node:crypto'
import { promisify } from 'node:util'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const scrypt = promisify(nodeScrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

export async function invalidateAllSessions(): Promise<void> {
  // Legacy KV session invalidation removed with Supabase-only admin auth.
}

export async function validateSession(_req: VercelRequest): Promise<boolean> {
  return false
}

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.status(404).json({
    error: 'Legacy admin auth has been removed.',
    message: 'Use Supabase authentication via /admin/login.',
  })
}
