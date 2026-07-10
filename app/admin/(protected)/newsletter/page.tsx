import { createAdminClient } from '@/lib/supabaseAdmin'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { NewsletterClientPage } from './NewsletterClientPage'
import { getNewsletterStatus, type NewsletterSubscriberRow } from '@/lib/newsletter-status'

export default async function NewsletterPage() {
  let subscribers: NewsletterSubscriberRow[] = []
  let error: string | null = null

  try {
    const supabase = createAdminClient()
    const { data, error: dbError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, consent_given, subscribed_at, confirmed_at, confirmation_token, confirmation_expires_at, unsubscribe_token, unsubscribed_at')
      .order('subscribed_at', { ascending: false })

    if (dbError) {
      error = dbError.message
    } else {
      subscribers = (data ?? []) as NewsletterSubscriberRow[]
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load subscribers'
  }

  const activeCount = subscribers.filter((s) => getNewsletterStatus(s) === 'active').length
  const pendingCount = subscribers.filter((s) => getNewsletterStatus(s) === 'pending').length
  const unsubscribedCount = subscribers.filter((s) => getNewsletterStatus(s) === 'unsubscribed').length

  return (
    <div>
      <AdminPageHeader
        title="Newsletter Subscribers"
        description="Manage mailing list subscribers, resend confirmations, and send campaigns to active subscribers."
      />

      {error ? (
        <div className="border border-red-800 bg-red-900/20 rounded p-4 text-sm text-red-400">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-white">{subscribers.length}</div>
              <div className="text-xs text-zinc-500 mt-1">Total</div>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-green-400">{activeCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Active</div>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Pending</div>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-zinc-400">{unsubscribedCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Unsubscribed</div>
            </div>
          </div>

          <NewsletterClientPage subscribers={subscribers} activeCount={activeCount} />
        </>
      )}
    </div>
  )
}