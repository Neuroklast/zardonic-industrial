import { createAdminClient } from '@/lib/supabaseAdmin'

export type ContactEventCategory = 'accepted' | 'configuration' | 'provider' | 'rate_limit' | 'internal'

export interface ContactEvent {
  category: ContactEventCategory
  code: string
  detail: string
  http_status?: number | null
}

/**
 * Keep a tiny, privacy-safe operational log. Never store the sender's address,
 * name, subject, message, provider request body, secrets or IP address.
 * A logging failure must never turn successful email delivery into a 503.
 */
export async function recordContactEvent(event: ContactEvent): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('contact_delivery_events').insert({
      category: event.category,
      code: event.code.slice(0, 80),
      detail: event.detail.slice(0, 300),
      http_status: event.http_status ?? null,
    })
    if (error) console.error('[contact-diagnostics] Could not save diagnostic event', error.code)
  } catch {
    console.error('[contact-diagnostics] Operational log unavailable')
  }
}

export interface ResendErrorInfo {
  code: string
  detail: string
}

export function explainResendError(status: number, upstream: unknown): ResendErrorInfo {
  const info = upstream && typeof upstream === 'object' && !Array.isArray(upstream)
    ? upstream as Record<string, unknown> : {}
  const name = typeof info.name === 'string'
    ? info.name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40) : 'unknown'
  const message = typeof info.message === 'string' ? info.message.toLowerCase() : ''
  const code = `resend_${status}_${name}`
  if (status === 401) {
    return { code, detail: 'Resend rejected the API key (401). Check Admin > API Keys and the active environment.' }
  }
  if (status === 403) {
    return {
      code,
      detail: /domain|verified|sender|from/.test(message)
        ? 'Resend rejected the sender domain (403). Verify the sending domain and FROM address in Resend.'
        : 'Resend denied this API request (403). Check API key scope and sender domain verification.',
    }
  }
  if (status === 422 || status === 400) {
    return { code, detail: 'Resend rejected the email payload. Check sender, recipient and domain configuration.' }
  }
  if (status === 429) {
    return { code, detail: 'Resend rate limit reached. Reduce email throughput or check provider limits.' }
  }
  if (status >= 500) {
    return { code, detail: 'Resend is temporarily unavailable or returned a server error.' }
  }
  return { code, detail: `Resend rejected the email request (HTTP ${status}).` }
}
