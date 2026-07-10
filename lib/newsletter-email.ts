import { getApiSecret } from '@/lib/api-secrets'
import { getSiteOrigin } from '@/lib/og-share'

const DEFAULT_FROM = 'no-reply@zardonic.com'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br />')
}

interface ResendEmailPayload {
  from: string
  to: string[]
  subject: string
  html: string
}

async function sendResendEmail(payload: ResendEmailPayload): Promise<boolean> {
  const resendKey = await getApiSecret('resend_api_key')
  if (!resendKey) {
    console.info('[newsletter-email]', { to: payload.to, subject: payload.subject })
    return true
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + resendKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error('[newsletter-email] Resend error:', res.status, await res.text())
    return false
  }

  return true
}

export function buildConfirmUrl(token: string): string {
  return `${getSiteOrigin()}/newsletter/confirm?token=${encodeURIComponent(token)}`
}

export function buildUnsubscribeUrl(token: string): string {
  return `${getSiteOrigin()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

export async function sendConfirmationEmail(email: string, confirmUrl: string): Promise<boolean> {
  const html = `
    <p>Please confirm your subscription to the Zardonic mailing list.</p>
    <p><a href="${escapeHtml(confirmUrl)}">Confirm subscription</a></p>
    <p>If you did not request this, you can ignore this email.</p>
    <p style="color:#888;font-size:12px;">This link expires in 7 days.</p>
  `
  return sendResendEmail({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Confirm your newsletter subscription',
    html,
  })
}

export async function sendWelcomeEmail(email: string, unsubscribeUrl: string): Promise<boolean> {
  const html = `
    <p>You're subscribed to the Zardonic mailing list.</p>
    <p>You'll receive news about releases, gigs, and exclusive content.</p>
    <p style="color:#888;font-size:12px;">
      <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a> at any time.
    </p>
  `
  return sendResendEmail({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Welcome to the Zardonic mailing list',
    html,
  })
}

export async function sendUnsubscribeConfirmationEmail(email: string): Promise<boolean> {
  const html = `
    <p>You have been unsubscribed from the Zardonic mailing list.</p>
    <p>You will no longer receive newsletter emails from us.</p>
  `
  return sendResendEmail({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Newsletter unsubscribed',
    html,
  })
}

const BATCH_SIZE = 100

export interface CampaignRecipient {
  email: string
  unsubscribeToken: string
}

function campaignHtml(body: string, unsubscribeUrl: string): string {
  return `${textToHtml(body)}<hr /><p style="color:#888;font-size:12px;"><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`
}

export async function sendNewsletterBatch(
  recipients: CampaignRecipient[],
  subject: string,
  body: string,
): Promise<{ sent: number; failed: number }> {
  const resendKey = await getApiSecret('resend_api_key')
  if (!resendKey) {
    console.info('[newsletter-campaign]', { recipients: recipients.length, subject })
    return { sent: recipients.length, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE)
    const batch = chunk.map((recipient) => ({
      from: DEFAULT_FROM,
      to: [recipient.email],
      subject,
      html: campaignHtml(body, buildUnsubscribeUrl(recipient.unsubscribeToken)),
    }))

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + resendKey,
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      console.error('[newsletter-campaign] batch error:', res.status, await res.text())
      failed += chunk.length
    } else {
      sent += chunk.length
    }
  }

  return { sent, failed }
}