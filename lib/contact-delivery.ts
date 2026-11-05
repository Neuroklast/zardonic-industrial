import { getApiSecret } from '@/lib/api-secrets'
import { resolveContactSender } from '@/lib/contact-sender'
import { explainResendError, recordContactEvent } from '@/lib/contact-diagnostics'
import type { ContactFormData } from '@/lib/contact-form'

type ContactMessage = Pick<ContactFormData, 'name' | 'email' | 'subject' | 'message'>
export interface ContactResult { success?: boolean; error?: string }

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

/** Shared by the stable API and legacy Server Action. */
export async function deliverContactMessage(
  { name, email, subject, message }: ContactMessage,
): Promise<ContactResult> {
  try {
    const resendKey = await getApiSecret('resend_api_key')
    if (!resendKey) {
      console.error('[contact] Resend is not configured')
      await recordContactEvent({ category: 'configuration', code: 'resend_key_missing', detail: 'No usable Resend API key on this deployment. Check encryption key or RESEND_API_KEY.' })
      return { error: 'Contact form is temporarily unavailable. Please try again later.' }
    }
    const to = process.env.CONTACT_EMAIL?.trim() || 'contact@zardonic.com'
    const sender = await resolveContactSender(resendKey)
    if (!sender.from) {
      console.error('[contact] Resend sending domain is not configured or verified', sender.code)
      await recordContactEvent({
        category: 'configuration',
        code: sender.code ?? 'sender_unavailable',
        detail: sender.error ?? 'No usable Resend sender address is configured.',
        http_status: 503,
      })
      return { error: 'Contact form is temporarily unavailable. Please try again later.' }
    }
    // Prefer the requested FROM address only if its domain is verified.
    // Otherwise use the already verified Zardonic domain selected above.
    const from = sender.from
    const html = [
      `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>`,
      `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`,
      '<hr />',
      `<p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`,
    ].join('\n')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Contact] ${subject}`,
        html,
      }),
      cache: 'no-store',
    })
    if (!response.ok) {
      // Provider errors are only logged server-side. Do not expose API keys,
      // addresses, or upstream validation payloads to public visitors.
      const providerError: unknown = await response.json().catch(() => null)
      const reason = providerError && typeof providerError === 'object'
        ? providerError as Record<string, unknown> : {}
      const diagnostic = explainResendError(response.status, reason)
      console.error('[contact] Resend rejected message', { status: response.status, code: diagnostic.code })
      await recordContactEvent({ category: 'provider', code: diagnostic.code, detail: diagnostic.detail, http_status: response.status })
      return { error: 'Failed to send message. Please try again later.' }
    }
    await recordContactEvent({ category: 'accepted', code: 'resend_accepted', detail: 'Resend accepted this message. Inbox delivery is not guaranteed.', http_status: response.status })
    return { success: true }
  } catch (error) {
    console.error('[contact] Delivery failed:', error instanceof Error ? error.name : 'unknown error')
    await recordContactEvent({ category: 'internal', code: 'delivery_exception', detail: 'Delivery failed before Resend accepted the request. Check server configuration and network access.' })
    return { error: 'Failed to send message. Please try again later.' }
  }
}
