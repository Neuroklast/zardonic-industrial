import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  buildConfirmUrl,
  buildUnsubscribeUrl,
  sendConfirmationEmail,
  sendUnsubscribeConfirmationEmail,
  sendWelcomeEmail,
} from '@/lib/newsletter-email'
import {
  generateNewsletterToken,
  isConfirmationExpired,
  newsletterConfirmationExpiry,
} from '@/lib/newsletter-tokens'
import type { NewsletterSubscriberRow } from '@/lib/newsletter-status'

export type NewsletterActionResult =
  | { success: true; pending?: boolean }
  | { error: string }

function pendingTokens() {
  const confirmation_token = generateNewsletterToken()
  return {
    confirmation_token,
    confirmation_expires_at: newsletterConfirmationExpiry(),
    confirmed_at: null as string | null,
    unsubscribe_token: null as string | null,
    unsubscribed_at: null as string | null,
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function requestNewsletterSubscription(email: string): Promise<NewsletterActionResult> {
  const supabase = createAdminClient()
  const normalizedEmail = normalizeEmail(email)
  const tokens = pendingTokens()

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, confirmed_at, unsubscribed_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing) {
    const row = existing as Pick<NewsletterSubscriberRow, 'confirmed_at' | 'unsubscribed_at'>
    if (!row.unsubscribed_at && row.confirmed_at) {
      return { error: 'This email address is already subscribed.' }
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        ...tokens,
        consent_given: true,
        subscribed_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)

    if (error) return { error: 'Something went wrong. Please try again.' }
  } else {
    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: normalizedEmail,
      consent_given: true,
      ...tokens,
    })
    if (error) return { error: 'Something went wrong. Please try again.' }
  }

  const sent = await sendConfirmationEmail(normalizedEmail, buildConfirmUrl(tokens.confirmation_token))
  if (!sent) return { error: 'Could not send confirmation email. Please try again later.' }

  return { success: true, pending: true }
}

export async function confirmNewsletterSubscription(token: string): Promise<NewsletterActionResult> {
  const supabase = createAdminClient()

  const { data: row } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, confirmation_token, confirmation_expires_at, confirmed_at, unsubscribed_at')
    .eq('confirmation_token', token)
    .maybeSingle()

  if (!row) return { error: 'Invalid or expired confirmation link.' }

  const subscriber = row as Pick<
    NewsletterSubscriberRow,
    'email' | 'confirmation_expires_at' | 'confirmed_at' | 'unsubscribed_at'
  >

  if (subscriber.unsubscribed_at) return { error: 'This subscription is no longer active.' }
  if (subscriber.confirmed_at) return { success: true }

  if (isConfirmationExpired(subscriber.confirmation_expires_at)) {
    return { error: 'This confirmation link has expired. Please subscribe again.' }
  }

  const unsubscribe_token = generateNewsletterToken()
  const confirmed_at = new Date().toISOString()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      confirmed_at,
      confirmation_token: null,
      confirmation_expires_at: null,
      unsubscribe_token,
    })
    .eq('confirmation_token', token)

  if (error) return { error: 'Something went wrong. Please try again.' }

  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribe_token)
  await sendWelcomeEmail(subscriber.email, unsubscribeUrl)

  return { success: true }
}

export async function unsubscribeNewsletterByToken(token: string): Promise<NewsletterActionResult> {
  const supabase = createAdminClient()

  const { data: row } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (!row) return { error: 'Invalid unsubscribe link.' }

  const subscriber = row as Pick<NewsletterSubscriberRow, 'email' | 'unsubscribed_at'>
  if (subscriber.unsubscribed_at) return { success: true }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)

  if (error) return { error: 'Something went wrong. Please try again.' }

  await sendUnsubscribeConfirmationEmail(subscriber.email)
  return { success: true }
}

export async function resendNewsletterConfirmation(subscriberId: string): Promise<NewsletterActionResult> {
  const supabase = createAdminClient()

  const { data: row } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, confirmed_at, unsubscribed_at')
    .eq('id', subscriberId)
    .maybeSingle()

  if (!row) return { error: 'Subscriber not found.' }

  const subscriber = row as Pick<NewsletterSubscriberRow, 'email' | 'confirmed_at' | 'unsubscribed_at'>
  if (subscriber.unsubscribed_at) return { error: 'Subscriber is unsubscribed.' }
  if (subscriber.confirmed_at) return { error: 'Subscriber is already confirmed.' }

  const confirmation_token = generateNewsletterToken()
  const confirmation_expires_at = newsletterConfirmationExpiry()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ confirmation_token, confirmation_expires_at })
    .eq('id', subscriberId)

  if (error) return { error: 'Could not update subscriber.' }

  const sent = await sendConfirmationEmail(subscriber.email, buildConfirmUrl(confirmation_token))
  if (!sent) return { error: 'Could not send confirmation email.' }

  return { success: true }
}