'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  adminDeleteSubscriber,
  adminResendConfirmation,
  adminSendNewsletterCampaign,
  adminUnsubscribeSubscriber,
} from '@/app/admin/_actions/newsletter'
import { getNewsletterStatus, type NewsletterSubscriberRow } from '@/lib/newsletter-status'

type Subscriber = NewsletterSubscriberRow

interface NewsletterClientPageProps {
  subscribers: Subscriber[]
  activeCount: number
}

function statusLabel(status: ReturnType<typeof getNewsletterStatus>): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'active':
      return 'Active'
    case 'unsubscribed':
      return 'Unsubscribed'
  }
}

function statusBadgeClass(status: ReturnType<typeof getNewsletterStatus>): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-900/40 text-amber-400 border-amber-800'
    case 'active':
      return 'bg-green-900/40 text-green-400 border border-green-800'
    case 'unsubscribed':
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700'
  }
}

export function NewsletterClientPage({ subscribers, activeCount }: NewsletterClientPageProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [campaignResult, setCampaignResult] = useState<string | null>(null)

  function handleExportCsv() {
    const header = 'email,status,subscribed_at,confirmed_at,unsubscribed_at'
    const rows = subscribers.map((s) => {
      const status = getNewsletterStatus(s)
      return `${s.email},${status},${s.subscribed_at},${s.confirmed_at ?? ''},${s.unsubscribed_at ?? ''}`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function runAction(action: () => Promise<{ error?: string; success?: boolean } | { error: string }>) {
    setActionError(null)
    startTransition(async () => {
      const result = await action()
      if ('error' in result && result.error) {
        setActionError(result.error)
        return
      }
      router.refresh()
    })
  }

  function handleSendCampaign(formData: FormData) {
    if (!window.confirm(`Send newsletter to ${activeCount} active subscriber(s)?`)) return

    setActionError(null)
    setCampaignResult(null)
    startTransition(async () => {
      const result = await adminSendNewsletterCampaign(formData)
      if ('error' in result) {
        setActionError(result.error)
        return
      }
      if ('sent' in result) {
        setCampaignResult(`Sent to ${result.sent} of ${result.total} subscribers.${result.failed ? ` ${result.failed} failed.` : ''}`)
      }
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 border border-zinc-800 rounded p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Send Newsletter</h2>
        <p className="text-xs text-zinc-500">
          Sends to {activeCount} confirmed active subscriber{activeCount === 1 ? '' : 's'} via Resend.
        </p>
        <form action={handleSendCampaign} className="space-y-3">
          <div>
            <label htmlFor="campaign-subject" className="block text-xs text-zinc-500 mb-1">Subject</label>
            <input
              id="campaign-subject"
              name="subject"
              required
              maxLength={200}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label htmlFor="campaign-body" className="block text-xs text-zinc-500 mb-1">Body (plain text)</label>
            <textarea
              id="campaign-body"
              name="body"
              required
              rows={6}
              maxLength={50000}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={pending || activeCount === 0}
            className="px-4 py-2 text-sm rounded bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 transition-colors"
          >
            {pending ? 'Sending…' : 'Send to active subscribers'}
          </button>
        </form>
        {campaignResult ? <p className="text-xs text-green-400">{campaignResult}</p> : null}
      </section>

      {actionError ? (
        <div className="border border-red-800 bg-red-900/20 rounded p-3 text-sm text-red-400">{actionError}</div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Subscriber List</h2>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            aria-label="Export subscribers as CSV"
          >
            ↓ Export CSV
          </button>
        </div>

        <div className="border border-zinc-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Email</th>
                  <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Subscribed</th>
                  <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Confirmed</th>
                  <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-sm">
                      No subscribers yet.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => {
                    const status = getNewsletterStatus(sub)
                    return (
                      <tr key={sub.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                        <td className="px-4 py-2.5 text-zinc-200 font-mono text-xs">{sub.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${statusBadgeClass(status)}`}>
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">
                          {format(new Date(sub.subscribed_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">
                          {sub.confirmed_at ? format(new Date(sub.confirmed_at), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-2">
                            {status === 'pending' ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => runAction(() => adminResendConfirmation(sub.id))}
                                className="text-xs text-zinc-400 hover:text-white disabled:opacity-50"
                              >
                                Resend confirm
                              </button>
                            ) : null}
                            {status === 'active' ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => runAction(() => adminUnsubscribeSubscriber(sub.id))}
                                className="text-xs text-zinc-400 hover:text-white disabled:opacity-50"
                              >
                                Unsubscribe
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                if (!window.confirm(`Delete ${sub.email}? This cannot be undone.`)) return
                                runAction(() => adminDeleteSubscriber(sub.id))
                              }}
                              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}