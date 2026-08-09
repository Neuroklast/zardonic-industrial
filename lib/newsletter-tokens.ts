import { randomBytes } from 'node:crypto'

const TOKEN_BYTES = 32

/** Cryptographically secure token for confirm/unsubscribe links. */
export function generateNewsletterToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex')
}

/** Double opt-in confirmation links expire after 7 days. */
export function newsletterConfirmationExpiry(): string {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  return expires.toISOString()
}

export function isConfirmationExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() < Date.now()
}