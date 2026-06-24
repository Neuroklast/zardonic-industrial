'use server'

import { getApiSecret } from '@/lib/api-secrets'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function submitContact(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Please fill in all required fields correctly.' }
  }

  const { name, email, subject, message } = parsed.data
  const resendKey = await getApiSecret('resend_api_key')
  const contactEmail = process.env.CONTACT_EMAIL ?? 'contact@zardonic.com'

  if (!resendKey) {
    // Dev / unconfigured – log and succeed silently
    console.info('[contact]', { name, email, subject })
    return { success: true }
  }

  const htmlBody = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + resendKey,
    },
    body: JSON.stringify({
      from: 'no-reply@zardonic.com',
      to: [contactEmail],
      reply_to: email,
      subject: '[Contact] ' + subject,
      html: htmlBody,
    }),
  })

  if (!res.ok) {
    return { error: 'Failed to send message. Please try again later.' }
  }

  return { success: true }
}
