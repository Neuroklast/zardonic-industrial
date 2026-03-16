import { kv } from '@vercel/kv'
import { randomBytes } from 'node:crypto'

export type SecurityEventSeverity = 'info' | 'warn' | 'high' | 'critical'

export interface SecurityGeo {
  countryCode?: string | null
  region?: string | null
  city?: string | null
}

export interface SecurityLogEntry {
  id: string
  timestamp: string
  event: string
  severity: SecurityEventSeverity
  hashedIp: string
  userAgent: string
  method?: string
  url?: string
  geo?: SecurityGeo
  countermeasure?: string
  threatScore?: number
  threatLevel?: string
  details?: Record<string, unknown>
}

const SECURITY_LOG_KEY = 'zi-security-log'
const MAX_LOG_ENTRIES = 1000

export async function logSecurityEvent(
  entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>,
): Promise<void> {
  const fullEntry: SecurityLogEntry = {
    id: randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
    ...entry,
  }

  console.error(`[SECURITY:${entry.event}]`, JSON.stringify(fullEntry))

  try {
    const count = await kv.lpush(SECURITY_LOG_KEY, JSON.stringify(fullEntry))
    if (typeof count === 'number' && count > MAX_LOG_ENTRIES) {
      await kv.ltrim(SECURITY_LOG_KEY, 0, MAX_LOG_ENTRIES - 1)
    }
  } catch {
    // KV failure must never surface to the caller
  }
}
