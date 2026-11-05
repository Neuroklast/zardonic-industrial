/**
 * Find a usable Resend sender without guessing that a domain is verified.
 * Only @zardonic.net sender addresses are permitted. Reject all other
 * domains, including subdomains, regardless of domain verification.
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

const REQUIRED_DOMAIN = 'zardonic.net'
const DEFAULT_SENDER = 'no-reply@zardonic.net'

function isRequiredSenderAddress(raw: string): boolean {
  const sender = raw.trim()
  return /^[^@\s]+@zardonic\.net$/i.test(sender)
}

export function getConfiguredContactSender(): string {
  const configured = process.env.CONTACT_FROM_EMAIL?.trim()
    || process.env.EMAIL_FROM?.trim()
  return configured && isRequiredSenderAddress(configured) ? configured : DEFAULT_SENDER
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
  // Ignore any configured address outside the required sender domain.
  const from = isRequiredSenderAddress(configuredSender) ? configuredSender : DEFAULT_SENDER
  if (!lookup.available) {
    // Sending-only API keys cannot inspect domains. Attempt the required
    // address, leaving actual domain authorization to Resend.
    return { from, verified: false }
  }

  const verified = lookup.domains.find((domain) =>
    domain.name.toLowerCase() === REQUIRED_DOMAIN
    && domain.status === 'verified'
    && domain.sendingEnabled,
  )
  if (verified) return { from, verified: true, eligibleDomains: [REQUIRED_DOMAIN] }
  return {
    code: 'zardonic_net_unverified',
    error: 'zardonic.net is not verified for sending in Resend. Verify zardonic.net and enable sending in the Resend domain settings.',
    eligibleDomains: [],
  }
}

export async function resolveContactSender(apiKey: string): Promise<SenderResolution> {
  const configuredSender = getConfiguredContactSender()
  const lookup = await getResendDomains(apiKey)
  return chooseContactSender(configuredSender, lookup)
}
