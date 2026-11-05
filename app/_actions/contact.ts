'use server'

import { contactFormSchema } from '@/lib/contact-form'
import { deliverContactMessage } from '@/lib/contact-delivery'
import { checkContactRateLimit } from '@/lib/server-rate-limit'

/** Legacy action retained for users with pages from previous deployments. */
export async function submitContact(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (String(formData.get('_hp') ?? '').trim()) return { success: true }
  const parsed = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    _hp: '',
  })
  if (!parsed.success) return { error: 'Please fill in all required fields correctly.' }
  const allowed = await checkContactRateLimit()
  if (!allowed) return { error: 'Too many messages. Please try again in a few minutes.' }
  return deliverContactMessage(parsed.data)
}
