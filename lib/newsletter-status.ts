export type NewsletterStatus = 'pending' | 'active' | 'unsubscribed'

export interface NewsletterSubscriberRow {
  id: string
  email: string
  consent_given: boolean
  subscribed_at: string
  confirmed_at: string | null
  confirmation_token: string | null
  confirmation_expires_at: string | null
  unsubscribe_token: string | null
  unsubscribed_at: string | null
}

export function getNewsletterStatus(row: Pick<NewsletterSubscriberRow, 'confirmed_at' | 'unsubscribed_at'>): NewsletterStatus {
  if (row.unsubscribed_at) return 'unsubscribed'
  if (!row.confirmed_at) return 'pending'
  return 'active'
}