'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { newsletterCampaignSchema } from '@/lib/newsletter-schema'
import { resendNewsletterConfirmation } from '@/lib/newsletter-service'
import { sendNewsletterBatch, type CampaignRecipient } from '@/lib/newsletter-email'
import { generateNewsletterToken } from '@/lib/newsletter-tokens'
import { getNewsletterStatus } from '@/lib/newsletter-status'
import { revalidatePath } from 'next/cache'

export async function adminUnsubscribeSubscriber(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/newsletter')
    return { success: true }
  }, 'Unable to unsubscribe subscriber.')
}

export async function adminDeleteSubscriber(id: string) {
  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/newsletter')
    return { success: true }
  }, 'Unable to delete subscriber.')
}

export async function adminResendConfirmation(id: string) {
  return runAdminAction(async () => {
    const result = await resendNewsletterConfirmation(id)
    if ('error' in result) return { error: result.error }
    revalidatePath('/admin/newsletter')
    return { success: true }
  }, 'Unable to resend confirmation email.')
}

export async function adminSendNewsletterCampaign(formData: FormData) {
  return runAdminAction(async () => {
    const parsed = newsletterCampaignSchema.safeParse({
      subject: formData.get('subject'),
      body: formData.get('body'),
    })
    if (!parsed.success) return { error: 'Please provide a subject and message body.' }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, confirmed_at, unsubscribed_at, unsubscribe_token')

    if (error) return { error: error.message }

    type SubscriberEmailRow = {
      id: string
      email: string
      confirmed_at: string | null
      unsubscribed_at: string | null
      unsubscribe_token: string | null
    }
    const rows = (data ?? []) as SubscriberEmailRow[]
    const activeRows = rows.filter((row) => getNewsletterStatus(row) === 'active')

    if (activeRows.length === 0) return { error: 'No active subscribers to send to.' }

    const recipients: CampaignRecipient[] = []
    for (const row of activeRows) {
      let token = row.unsubscribe_token
      if (!token) {
        token = generateNewsletterToken()
        const { error: tokenError } = await supabase
          .from('newsletter_subscribers')
          .update({ unsubscribe_token: token })
          .eq('id', row.id)
        if (tokenError) continue
      }
      recipients.push({ email: row.email, unsubscribeToken: token })
    }

    if (recipients.length === 0) return { error: 'No active subscribers with valid unsubscribe tokens.' }

    const { sent, failed } = await sendNewsletterBatch(
      recipients,
      parsed.data.subject,
      parsed.data.body,
    )

    if (failed > 0 && sent === 0) {
      return { error: 'Newsletter send failed. Please check Resend configuration.' }
    }

    return {
      success: true,
      sent,
      failed,
      total: recipients.length,
    }
  }, 'Unable to send newsletter.')
}