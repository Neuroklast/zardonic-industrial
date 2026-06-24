'use server'

import { getApiSecret } from '@/lib/api-secrets'
import { contactFormSchema } from '@/lib/contact-form'

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
  const hp = (formData.get('_hp') as string | null) ?? ''
  if (hp) {
    return { success: true }
  }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    _hp: '',
  }
  const parsed = contactFormSchema.safeParse(raw)
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
