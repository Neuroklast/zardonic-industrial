import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabaseAdmin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}))

import {
  API_SECRET_FIELDS,
  API_SECRET_KEYS,
  clearApiSecretsCache,
  getApiSecret,
  isValidApiSecretKey,
} from '@/lib/api-secrets'
import { decryptSecret, encryptSecret } from '@/lib/secrets-encryption'

const TEST_KEY = 'a'.repeat(64)

describe('secrets-encryption', () => {
  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
    delete process.env.SECRETS_ENCRYPTION_KEY
  })

  it('round-trips plaintext', () => {
    const encrypted = encryptSecret('my-secret-token')
    expect(decryptSecret(encrypted)).toBe('my-secret-token')
  })
})

describe('api-secrets', () => {
  beforeEach(() => {
    clearApiSecretsCache()
  })

  afterEach(() => {
    clearApiSecretsCache()
    delete process.env.SPOTIFY_CLIENT_ID
    delete process.env.DISCOGS_TOKEN
  })

  it('validates known secret keys', () => {
    expect(isValidApiSecretKey('spotify_client_id')).toBe(true)
    expect(isValidApiSecretKey('unknown_key')).toBe(false)
  })

  it('keeps registry keys in sync with field definitions', () => {
    const fieldKeys = API_SECRET_FIELDS.map((f) => f.key).sort()
    const registryKeys = [...API_SECRET_KEYS].sort()
    expect(fieldKeys).toEqual(registryKeys)
  })

  it('falls back to env when Supabase has no row', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'env-client-id'
    const value = await getApiSecret('spotify_client_id')
    expect(value).toBe('env-client-id')
  })
})