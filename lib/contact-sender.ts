/**
 * Find a usable Resend sender without guessing that a domain is verified.
 * The configured FROM address remains preferred when its exact domain is verified.
 * If it is not, only an already verified Zardonic domain is an automatic fallback.
 */

export interface ResendDomain {
  name: string
  status: string
  sendingEnabled: boolean
}

export interface ResendDomainLookup {
  available: boolean
  domains: ResendDomain[]
  statusCode?: number
}

function isZardonicDomain(domain: string): boolean {
  return domain === 'zardonic.net' || domain.endsWith('.zardonic.net')
    || domain === 'zardonic.com' || domain.endsWith('.zardonic.com')
}

export function getConfiguredContactSender(): string {
  return process.env.CONTACT_FROM_EMAIL?.trim()
    || process.env.EMAIL_FROM?.trim()
    || 'no-reply@zardonic.com'
}

export async function getResendDomains(apiKey: string): Promise<ResendDomainLookup> {
  try {
    const res = await fetch('https://api.resend.com/domains?limit=100', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(6500),
      cache: 'no-store',
    })
    if (!res.ok) return { available: false, domains: [], statusCode: res.status }
    const payload: unknown = await res.json()
    const raw = payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data : []
    const domains: ResendDomain[] = []
    if (Array.isArray(raw)) {
      for (const value of raw) {
        if (!value || typeof value !== 'object') continue
        const domain = value as Record<string, unknown>
        if (typeof domain.name !== 'string' || typeof domain.status !== 'string') continue
        const capabilities = domain.capabilities && typeof domain.capabilities === 'object'
          ? domain.capabilities as Record<string, unknown> : {}
        domains.push({
          name: domain.name.trim().toLowerCase(),
          status: domain.status,
          sendingEnabled: capabilities.sending !== 'disabled',
        })
      }
    }
    return { available: true, domains }
  } catch {
    // A send-only Resend key or a transient domains-list failure must not
    // prevent sending with a configured address.
    return { available: false, domains: [] }
  }
}

export interface SenderResolution {
  from?: string
  verified?: boolean
  error?: string
  code?: string
  eligibleDomains?: string[]
}

export function chooseContactSender(
  configuredSender: string,
  lookup: ResendDomainLookup,
): SenderResolution {
  if (!lookup.available) return { from: configuredSender, verified: false }
  const verified = lookup.domains
    .filter((domain) => domain.status === 'verified' && domain.sendingEnabled)
  const verifiedNames = new Set(verified.map((domain) => domain.name))
  const configuredDomain = configuredSender.split('@')[1]?.trim().toLowerCase()
  const eligibleDomains = verified.map((domain) => domain.name).filter(isZardonicDomain)

  if (configuredDomain && verifiedNames.has(configuredDomain)) {
    return { from: configuredSender, verified: true, eligibleDomains }
  }
  // Never silently switch to an unrelated brand's sending domain.
  const fallback = eligibleDomains.find((domain) => domain === 'zardonic.net')
    || eligibleDomains.find((domain) => domain === 'zardonic.com')
    || eligibleDomains[0]
  if (fallback) {
    return { from: `no-reply@${fallback}`, verified: true, eligibleDomains }
  }
  return {
    code: 'no_verified_sender_domain',
    error: 'No verified Zardonic sending domain is available in Resend. Verify zardonic.net or zardonic.com, or configure a FROM address on another domain already verified in this Resend account.',
    eligibleDomains,
  }
}

export async function resolveContactSender(apiKey: string): Promise<SenderResolution> {
  const configuredSender = getConfiguredContactSender()
  const lookup = await getResendDomains(apiKey)
  return chooseContactSender(configuredSender, lookup)
}
