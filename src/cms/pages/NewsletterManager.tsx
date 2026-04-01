/**
 * NewsletterManager — view and manage newsletter subscribers.
 */

import { useState } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Subscriber {
  id: string
  email: string
  isActive: boolean
  subscribedAt: string
  unsubscribedAt?: string
}

async function fetchSubscribers(): Promise<Subscriber[]> {
  const r = await fetch('/api/cms/newsletter')
  return r.json() as Promise<Subscriber[]>
}

export function NewsletterManager() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['cms', 'newsletter'], queryFn: fetchSubscribers })
  const [unsubscribeId, setUnsubscribeId] = useState<string | null>(null)

  const unsubscribeMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/cms/newsletter?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['cms', 'newsletter'] }); toast.success('Abgemeldet') },
    onError: () => toast.error('Fehler'),
  })

  const subscribers = data ?? []
  const active = subscribers.filter(s => s.isActive).length

  function exportCsv() {
    const rows = [['ID', 'Email', 'Active', 'Subscribed At'], ...subscribers.map(s => [s.id, s.email, String(s.isActive), s.subscribedAt])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Newsletter"
        breadcrumbs={['CMS', 'Newsletter']}
        actions={
          <button onClick={exportCsv} className="px-3 py-1.5 border border-zinc-600 text-zinc-400 font-mono text-xs hover:border-zinc-400">
            EXPORT CSV
          </button>
        }
      />
      <div className="p-6">
        <div className="flex gap-6 mb-6">
          <div className="p-4 border border-zinc-700">
            <div className="text-2xl font-mono text-red-400">{subscribers.length}</div>
            <div className="text-xs font-mono text-zinc-500">Total</div>
          </div>
          <div className="p-4 border border-zinc-700">
            <div className="text-2xl font-mono text-green-400">{active}</div>
            <div className="text-xs font-mono text-zinc-500">Active</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {subscribers.map(sub => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-sm font-mono text-zinc-200">{sub.email}</div>
                  <div className="text-xs font-mono text-zinc-600">
                    {new Date(sub.subscribedAt).toLocaleDateString('de-DE')}
                    {!sub.isActive && ' · UNSUBSCRIBED'}
                  </div>
                </div>
                {sub.isActive && (
                  <button
                    onClick={() => setUnsubscribeId(sub.id)}
                    className="text-xs font-mono text-zinc-500 hover:text-red-400 px-2 py-1 border border-zinc-800 hover:border-red-800"
                  >
                    UNSUBSCRIBE
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!unsubscribeId}
        onOpenChange={open => !open && setUnsubscribeId(null)}
        title="Abmelden"
        description="Diesen Subscriber vom Newsletter abmelden?"
        confirmLabel="Abmelden"
        onConfirm={() => { if (unsubscribeId) { unsubscribeMutation.mutate(unsubscribeId); setUnsubscribeId(null) } }}
      />
    </div>
  )
}
