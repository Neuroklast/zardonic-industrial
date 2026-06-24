/**
 * GET /api/env-check
 *
 * Returns the presence status of required environment variables.
 * Only reports whether each variable is set (boolean) — never exposes values.
 * Used by the SetupWizard to guide new users through ENV configuration.
 *
 * To prevent unauthenticated infrastructure enumeration, this endpoint
 * is only accessible when:
 *   a) Redis is not yet configured (initial setup, no auth possible), OR
 *   b) No admin password has been set yet (setup flow not yet completed), OR
 *   c) The caller has a valid admin session.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getApiSecretsStatus } from './_api-secrets.js'
import { isRedisConfigured, getRedisOrNull } from './_redis.js'
import { validateSession } from './auth.js'
import { isSecretsEncryptionConfigured } from '../lib/secrets-encryption.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Allow access if Redis is not configured — setup wizard needs this before
  // any authentication infrastructure exists.
  if (!isRedisConfigured()) {
    const secretsStatus = await getApiSecretsStatus()
    res.status(200).json({ vars: buildVars(secretsStatus) })
    return
  }

  // Allow access if no admin password has been set yet (setup not complete).
  const redis = getRedisOrNull()
  if (redis) {
    try {
      const passwordHash = (await redis.get('admin-password-hash')) as string | null
      if (!passwordHash) {
        const secretsStatus = await getApiSecretsStatus()
        res.status(200).json({ vars: buildVars(secretsStatus) })
        return
      }
    } catch { /* Redis error — fall through to session check */ }
  }

  // Otherwise require a valid admin session.
  const sessionValid = await validateSession(req)
  if (!sessionValid) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const secretsStatus = await getApiSecretsStatus()
  res.status(200).json({ vars: buildVars(secretsStatus) })
}

function buildVars(secretsStatus: Awaited<ReturnType<typeof getApiSecretsStatus>>): Record<string, boolean> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SECRETS_ENCRYPTION_KEY: isSecretsEncryptionConfigured(),
    R2_PUBLIC_HOST: !!process.env.R2_PUBLIC_HOST,
    RESEND_API_KEY: secretsStatus.resend_api_key,
    SPOTIFY_CLIENT_ID: secretsStatus.spotify_client_id,
    SPOTIFY_CLIENT_SECRET: secretsStatus.spotify_client_secret,
    DISCOGS_TOKEN: secretsStatus.discogs_token,
    BANDSINTOWN_API_KEY: secretsStatus.bandsintown_api_key,
  }
}
