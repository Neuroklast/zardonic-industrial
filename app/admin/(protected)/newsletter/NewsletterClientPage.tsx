'use client'

import { format } from 'date-fns'

interface Subscriber {
  id: string
  email: string
  consent_given: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

interface NewsletterClientPageProps {
  subscribers: Subscriber[]
}

export function NewsletterClientPage({ subscribers }: NewsletterClientPageProps) {
  function handleExportCsv() {
    const header = 'email,status,subscribed_at,unsubscribed_at'
    const rows = subscribers.map((s) => {
      const status = s.unsubscribed_at ? 'unsubscribed' : 'subscribed'
      const subAt = s.subscribed_at
      const unsubAt = s.unsubscribed_at ?? ''
      return `${s.email},${status},${subAt},${unsubAt}`
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

  return (
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
                <th className="text-left px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">Unsubscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 text-sm">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5 text-zinc-200 font-mono text-xs">{sub.email}</td>
                    <td className="px-4 py-2.5">
                      {sub.unsubscribed_at ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Unsubscribed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {format(new Date(sub.subscribed_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {sub.unsubscribed_at ? format(new Date(sub.unsubscribed_at), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
