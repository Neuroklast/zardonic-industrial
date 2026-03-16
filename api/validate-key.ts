import { kv } from '@vercel/kv'

interface VercelRequest {
  method?: string
  body?: Record<string, unknown>
  headers?: Record<string, string | string[] | undefined>
}
interface VercelResponse {
  setHeader(key: string, value: string): VercelResponse
  status(code: number): VercelResponse
  json(data: unknown): VercelResponse
  end(): VercelResponse
}

const PRIMARY_HOSTNAMES = [
  'zardonic.industrial',
  'www.zardonic.industrial',
  'zardonic-industrial.vercel.app',
]

function isPrimaryHost(host: string | undefined): boolean {
  if (!host) return false
  const hostname = host.split(':')[0]
  return PRIMARY_HOSTNAMES.includes(hostname)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ valid: false, error: 'Method not allowed' })

  const { key } = req.body || {}

  const hostHeader = req.headers?.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader ?? ''
  const IS_PRIMARY = isPrimaryHost(host)

  if (IS_PRIMARY) {
    return res.status(200).json({ valid: true, tier: 'agency', features: [], assignedThemes: [] })
  }

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return res.status(400).json({ valid: false, error: 'Invalid key format' })
  }

  const trimmedKey = key.trim()

  try {
    const isValid = await kv.sismember('activation-keys', trimmedKey)

    if (!isValid) {
      return res.status(200).json({ valid: false })
    }

    let tier = 'free'
    let features: string[] = []
    let assignedThemes: string[] = []
    try {
      const meta = await kv.hgetall(`activation-key-meta:${trimmedKey}`) as Record<string, unknown> | null
      if (meta) {
        if (typeof meta.tier === 'string') tier = meta.tier
        if (meta.features) {
          features = typeof meta.features === 'string'
            ? JSON.parse(meta.features)
            : meta.features as string[]
        }
        if (meta.assignedThemes) {
          assignedThemes = typeof meta.assignedThemes === 'string'
            ? JSON.parse(meta.assignedThemes)
            : meta.assignedThemes as string[]
        }
      }
    } catch {
      // Meta lookup is best-effort
    }

    return res.status(200).json({ valid: true, tier, features, assignedThemes })
  } catch (error) {
    console.error('[validate-key] KV error:', error)
    return res.status(200).json({ valid: IS_PRIMARY, error: 'Service temporarily unavailable' })
  }
}
