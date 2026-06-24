import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM encryption for API secrets stored in Supabase.
 * Requires SECRETS_ENCRYPTION_KEY (or OAUTH_ENCRYPTION_KEY) — 64 hex chars (32 bytes).
 */
export function getSecretsEncryptionKey(): Buffer {
  const key = process.env.SECRETS_ENCRYPTION_KEY ?? process.env.OAUTH_ENCRYPTION_KEY
  if (!key) {
    throw new Error('SECRETS_ENCRYPTION_KEY is not configured')
  }
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) {
    throw new Error('SECRETS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  return buf
}

export function encryptSecret(plaintext: string): string {
  const key = getSecretsEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret(encrypted: string): string {
  const key = getSecretsEncryptionKey()
  const buf = Buffer.from(encrypted, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

export function isSecretsEncryptionConfigured(): boolean {
  const key = process.env.SECRETS_ENCRYPTION_KEY ?? process.env.OAUTH_ENCRYPTION_KEY
  if (!key) return false
  try {
    return Buffer.from(key, 'hex').length === 32
  } catch {
    return false
  }
}