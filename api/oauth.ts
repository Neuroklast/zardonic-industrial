import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getApiSecret } from './_api-secrets.js'
import { kv, isRedisConfigured } from './_redis.js'
import { randomBytes } from 'node:crypto'
import { decryptSecret, encryptSecret, getSecretsEncryptionKey } from '../lib/secrets-encryption.js'
import { applyRateLimit, getClientIp } from './_ratelimit.js'
import { validateSession } from './auth.js'
interface OAuthProvider {
  name: string
  authUrl: string
  tokenUrl: string
  profileUrl: string
  scope: string
  clientId: () => Promise<string | undefined>
  clientSecret: () => Promise<string | undefined>
}

interface TokenRecord {
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
  displayName: string | null
  email: string | null
  connectedAt: string
  provider: string
}

interface OAuthLog {
  timestamp: string
  provider: string | undefined
  action: string
  success: boolean
  reason?: string
  displayName?: string | null
  email?: string | null
  ip?: string
}


// ---------------------------------------------------------------------------
// Token Encryption (AES-256-GCM)
// ---------------------------------------------------------------------------

const OAUTH_LOGS_KEY = 'oauth:logs'
const MAX_LOG_ENTRIES = 100
const STATE_TTL = 300 // 5 minutes

/** @deprecated Use getSecretsEncryptionKey from lib/secrets-encryption */
export function getEncryptionKey(): Buffer {
  return getSecretsEncryptionKey()
}

export function encryptToken(data: unknown): string {
  return encryptSecret(JSON.stringify(data))
}

export function decryptToken(encrypted: string): TokenRecord {
  return JSON.parse(decryptSecret(encrypted)) as TokenRecord
}

// ---------------------------------------------------------------------------
// Auth Logging
// ---------------------------------------------------------------------------

export async function appendOAuthLog(entry: OAuthLog): Promise<void> {
  try {
    const logs = ((await kv.get(OAUTH_LOGS_KEY)) as OAuthLog[] | null) || []
    const trimmed = [...logs, entry].slice(-MAX_LOG_ENTRIES)
    await kv.set(OAUTH_LOGS_KEY, trimmed)
  } catch (err) {
    console.error('Failed to write OAuth log:', err)
  }
}

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

export const PROVIDERS: Record<string, OAuthProvider> = {
  spotify: {
    name: 'Spotify',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    profileUrl: 'https://api.spotify.com/v1/me',
    scope: 'user-read-private user-read-email playlist-read-private',
    clientId: () => getApiSecret('spotify_client_id'),
    clientSecret: () => getApiSecret('spotify_client_secret'),
  },
  'google-drive': {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'https://www.googleapis.com/auth/drive.readonly email profile',
    clientId: () => getApiSecret('google_client_id'),
    clientSecret: () => getApiSecret('google_client_secret'),
  },
}

export function getCallbackUrl(req: VercelRequest, provider: string): string {
  const appUrl = process.env.OAUTH_APP_URL || process.env.SITE_URL
  if (!appUrl) {
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      return `http://localhost:5173/api/oauth?action=callback&provider=${provider}`
    }
    throw new Error('OAUTH_APP_URL or SITE_URL must be configured for OAuth')
  }
  return `${appUrl}/api/oauth?action=callback&provider=${provider}`
}

// ---------------------------------------------------------------------------
// Token Exchange
// ---------------------------------------------------------------------------

export async function exchangeCode(provider: string, code: string, redirectUri: string): Promise<Record<string, unknown>> {
  const cfg = PROVIDERS[provider]
  const [clientId, clientSecret] = await Promise.all([cfg.clientId(), cfg.clientSecret()])
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId || '',
    client_secret: clientSecret || '',
  })
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json()
}

export async function fetchProfile(provider: string, accessToken: string): Promise<Record<string, unknown> | null> {
  const cfg = PROVIDERS[provider]
  const res = await fetch(cfg.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<unknown> {
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!isRedisConfigured()) {
    return res.status(503).json({ error: 'Service unavailable', message: 'KV storage is not configured.' })
  }

  const query: Record<string, string | string[]> = req.query || {}
  const body = req.body || {}

  const rawAction = req.method === 'GET' ? query.action : body.action
  const rawProvider = req.method === 'GET' ? query.provider : body.provider
  const action: string | undefined = Array.isArray(rawAction) ? rawAction[0] : (rawAction as string | undefined)
  const provider: string | undefined = Array.isArray(rawProvider) ? rawProvider[0] : (rawProvider as string | undefined)

  // --- GET: status ---
  if (req.method === 'GET' && action === 'status') {
    const sessionValid = await validateSession(req)
    if (!sessionValid) return res.status(401).json({ error: 'Authentication required' })

    const providerKeys = Object.keys(PROVIDERS)
    const [statusEntries, logs] = await Promise.all([
      Promise.all(
        providerKeys.map(async (key) => {
          try {
            const encrypted = (await kv.get(`oauth:token:${key}`)) as string | null
            if (encrypted) {
              const token = decryptToken(encrypted)
              return [
                key,
                {
                  connected: true,
                  displayName: token.displayName || null,
                  email: token.email || null,
                  connectedAt: token.connectedAt || null,
                },
              ]
            }
            return [key, { connected: false }]
          } catch (err) {
            console.error(`Failed to fetch/decrypt OAuth token for provider '${key}':`, err)
            return [key, { connected: false }]
          }
        }),
      ),
      (await kv.get(OAUTH_LOGS_KEY)) as OAuthLog[] | null,
    ])

    const statuses = Object.fromEntries(statusEntries)
    return res.json({ statuses, logs: logs || [] })
  }

  // --- GET: authorize ---
  if (req.method === 'GET' && action === 'authorize') {
    const sessionValid = await validateSession(req)
    if (!sessionValid) return res.status(401).json({ error: 'Authentication required' })

    if (!provider || !PROVIDERS[provider]) {
      return res.status(400).json({ error: 'Invalid provider' })
    }
    const cfg = PROVIDERS[provider]!
    const clientId = await cfg.clientId()
    if (!clientId) {
      return res.status(503).json({
        error: `${cfg.name} OAuth is not configured. Set credentials in Admin → API Keys.`,
      })
    }

    const state = randomBytes(16).toString('hex')
    await kv.set(`oauth:state:${state}`, { provider, ip: getClientIp(req) }, { ex: STATE_TTL })

    const redirectUri = getCallbackUrl(req, provider)
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: cfg.scope,
      state,
    })
    if (provider === 'google-drive') {
      params.set('access_type', 'offline')
      params.set('prompt', 'consent')
    }
    return res.json({ authUrl: `${cfg.authUrl}?${params.toString()}` })
  }

  // --- GET: callback ---
  if (req.method === 'GET' && action === 'callback') {
    const code = Array.isArray(query.code) ? query.code[0] : query.code
    const state = Array.isArray(query.state) ? query.state[0] : query.state
    const oauthError = Array.isArray(query.error) ? query.error[0] : query.error
    const postMessageOrigin = process.env.OAUTH_APP_URL || process.env.SITE_URL || '*'

    if (oauthError) {
      await appendOAuthLog({
        timestamp: new Date().toISOString(),
        provider,
        action: 'connect',
        success: false,
        reason: oauthError,
      })
      return res.status(400).send(
        `<html><body><script>window.opener?.postMessage({type:'oauth-callback',success:false,error:${JSON.stringify(oauthError)}},${JSON.stringify(postMessageOrigin)});window.close()</script><p>Connection failed: ${oauthError}. You can close this window.</p></body></html>`,
      )
    }

    if (!state || !code) {
      return res.status(400).send('<html><body><p>Invalid callback parameters.</p></body></html>')
    }

    const storedState = (await kv.get(`oauth:state:${state}`)) as { provider: string; ip: string } | null
    if (!storedState || storedState.provider !== provider) {
      await appendOAuthLog({
        timestamp: new Date().toISOString(),
        provider,
        action: 'connect',
        success: false,
        reason: 'invalid_state',
      })
      return res.status(403).send('<html><body><p>Invalid or expired state. Please try again.</p></body></html>')
    }
    await kv.del(`oauth:state:${state}`)

    try {
      const currentProvider = provider ?? storedState.provider
      const redirectUri = getCallbackUrl(req, currentProvider)
      const tokenData = await exchangeCode(currentProvider, code, redirectUri)
      const profile = await fetchProfile(currentProvider, tokenData.access_token as string)

      const tokenRecord = {
        accessToken: tokenData.access_token as string,
        refreshToken: (tokenData.refresh_token as string | null | undefined) || null,
        expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in as number) * 1000 : null,
        displayName: (profile?.['display_name'] as string | null) || (profile?.['name'] as string | null) || null,
        email: (profile?.['email'] as string | null) || null,
        connectedAt: new Date().toISOString(),
        provider: currentProvider,
      }

      const encrypted = encryptToken(tokenRecord)
      await kv.set(`oauth:token:${currentProvider}`, encrypted)

      await appendOAuthLog({
        timestamp: new Date().toISOString(),
        provider: currentProvider,
        action: 'connect',
        success: true,
        displayName: tokenRecord.displayName,
        email: tokenRecord.email,
      })

      const cfg = PROVIDERS[currentProvider]!
      const displayName = tokenRecord.displayName || tokenRecord.email || cfg.name
      return res.status(200).send(
        `<html><body><script>window.opener?.postMessage({type:'oauth-callback',success:true,provider:${JSON.stringify(currentProvider)},displayName:${JSON.stringify(displayName)}},${JSON.stringify(postMessageOrigin)});window.close()</script><p>Connected to ${cfg.name} as ${displayName}. You can close this window.</p></body></html>`,
      )
    } catch (err) {
      console.error('OAuth callback error:', err)
      await appendOAuthLog({
        timestamp: new Date().toISOString(),
        provider,
        action: 'connect',
        success: false,
        reason: (err as Error).message,
      })
      return res.status(500).send(
        `<html><body><script>window.opener?.postMessage({type:'oauth-callback',success:false,error:'connection_failed'},${JSON.stringify(postMessageOrigin)});window.close()</script><p>OAuth connection failed. Please try again.</p></body></html>`,
      )
    }
  }

  // --- POST: disconnect ---
  if (req.method === 'POST') {
    const allowed = await applyRateLimit(req, res)
    if (!allowed) return

    const sessionValid = await validateSession(req)
    if (!sessionValid) return res.status(401).json({ error: 'Authentication required' })

    if (action !== 'disconnect') return res.status(400).json({ error: 'Invalid action' })
    if (!provider || !PROVIDERS[provider]) return res.status(400).json({ error: 'Invalid provider' })

    await kv.del(`oauth:token:${provider}`)
    await appendOAuthLog({
      timestamp: new Date().toISOString(),
      provider,
      action: 'disconnect',
      success: true,
      ip: getClientIp(req),
    })

    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
