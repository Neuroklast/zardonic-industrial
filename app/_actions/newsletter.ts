'use server'

import { newsletterSubscribeSchema, newsletterTokenSchema } from '@/lib/newsletter-schema'
import {
  confirmNewsletterSubscription,
  requestNewsletterSubscription,
  unsubscribeNewsletterByToken,
} from '@/lib/newsletter-service'
import { checkNewsletterRateLimit } from '@/lib/server-rate-limit'

export type NewsletterFormState = {
  error?: string
  success?: boolean
  pending?: boolean
} | null

export async function subscribeNewsletter(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const hp = (formData.get('_hp') as string | null) ?? ''
  if (hp) return { success: true, pending: true }

  const raw = {
    email: formData.get('email'),
    consent_given: formData.get('consent_given'),
    _hp: '',
  }
  const parsed = newsletterSubscribeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Please provide a valid email address and accept the privacy policy.' }
  }

  const allowed = await checkNewsletterRateLimit()
  if (!allowed) {
    return { error: 'Too many attempts. Please try again in a few minutes.' }
  }

  return requestNewsletterSubscription(parsed.data.email)
}

export async function confirmNewsletter(token: string): Promise<NewsletterFormState> {
  const parsed = newsletterTokenSchema.safeParse(token)
  if (!parsed.success) return { error: 'Invalid or expired confirmation link.' }
  return confirmNewsletterSubscription(parsed.data)
}

export async function unsubscribeNewsletter(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const token = formData.get('token')
  const parsed = newsletterTokenSchema.safeParse(token)
  if (!parsed.success) return { error: 'Invalid unsubscribe link.' }
  return unsubscribeNewsletterByToken(parsed.data)
}