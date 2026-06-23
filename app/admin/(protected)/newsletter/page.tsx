import { createAdminClient } from '@/lib/supabaseAdmin'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { NewsletterClientPage } from './NewsletterClientPage'

interface Subscriber {
  id: string
  email: string
  consent_given: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

export default async function NewsletterPage() {
  let subscribers: Subscriber[] = []
  let error: string | null = null

  try {
    const supabase = createAdminClient()
    const { data, error: dbError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, consent_given, subscribed_at, unsubscribed_at')
      .order('subscribed_at', { ascending: false })

    if (dbError) {
      error = dbError.message
    } else {
      subscribers = (data ?? []) as Subscriber[]
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load subscribers'
  }

  const activeCount = subscribers.filter((s) => s.unsubscribed_at === null).length

  return (
    <div>
      <AdminPageHeader
        title="Newsletter Subscribers"
        description="Manage your mailing list subscribers and export consent records."
      />

      {error ? (
        <div className="border border-red-800 bg-red-900/20 rounded p-4 text-sm text-red-400">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-white">{subscribers.length}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Subscribers</div>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-green-400">{activeCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Active</div>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-2xl font-bold text-zinc-400">{subscribers.length - activeCount}</div>
              <div className="text-xs text-zinc-500 mt-1">Unsubscribed</div>
            </div>
          </div>

          <NewsletterClientPage subscribers={subscribers} />
        </>
      )}
    </div>
  )
}
