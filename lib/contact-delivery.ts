import { getApiSecret } from '@/lib/api-secrets'
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
      return { error: 'Contact form is temporarily unavailable. Please try again later.' }
    }
    const to = process.env.CONTACT_EMAIL?.trim() || 'contact@zardonic.com'
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
        from: 'no-reply@zardonic.com',
        to: [to],
        reply_to: email,
        subject: `[Contact] ${subject}`,
        html,
      }),
      cache: 'no-store',
    })
    if (!response.ok) {
      console.error('[contact] Resend rejected message; HTTP status:', response.status)
      return { error: 'Failed to send message. Please try again later.' }
    }
    return { success: true }
  } catch (error) {
    console.error('[contact] Delivery failed:', error instanceof Error ? error.message : 'unknown error')
    return { error: 'Failed to send message. Please try again later.' }
  }
}
