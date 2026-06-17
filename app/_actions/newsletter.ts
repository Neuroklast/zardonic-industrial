'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  consent_given: z.literal('true'),
})

export async function subscribeNewsletter(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    email: formData.get('email'),
    consent_given: formData.get('consent_given'),
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Please provide a valid email address and accept the privacy policy.' }
  }

  const supabase = createAdminClient()

  // Check for existing subscriber
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, unsubscribed_at')
    .eq('email', parsed.data.email)
    .single()

  if (existing) {
    if (!(existing as { unsubscribed_at: string | null }).unsubscribed_at) {
      return { error: 'This email address is already subscribed.' }
    }
    // Re-subscribe
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
      .eq('email', parsed.data.email)
    if (error) return { error: 'Something went wrong. Please try again.' }
    return { success: true }
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: parsed.data.email, consent_given: true })
  if (error) return { error: 'Something went wrong. Please try again.' }

  return { success: true }
}
