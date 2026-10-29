'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewMcpContent } from '@/app/admin/_actions/mcpContent'

export type ContentReviewRow = {
  id: string
  collection: string
  operation: string
  target_id: string | null
  target_key: string | null
  changes: unknown
  previous_snapshot: unknown
  status: string
  created_at: string
  requested_by: string
  reviewed_at: string | null
  error: string | null
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {}
}
function printValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Not set'
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}
function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function ReviewSlider({
  initialPending, recentDecisions,
}: {
  initialPending: ContentReviewRow[]
  recentDecisions: ContentReviewRow[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(initialPending)
  const [history, setHistory] = useState(recentDecisions)
  const [index, setIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [inFlight, setInFlight] = useState<string[]>([])
  const [details, setDetails] = useState(false)

  const current = pending[Math.min(index, Math.max(0, pending.length - 1))]
  const before = asObject(current?.operation === 'config'
    ? asObject(current.previous_snapshot).value : current?.previous_snapshot)
  const after = asObject(current?.changes)
  const changes = useMemo(() => Object.entries(after), [current?.id])
  const title = String(after.title ?? after.name ?? before.title ?? before.name
    ?? current?.target_key ?? current?.collection ?? 'No pending requests')

  const move = useCallback((direction: number) => {
    setIndex(n => Math.max(0, Math.min(pending.length - 1, n + direction)))
    setMessage('')
    setDetails(false)
  }, [pending.length])

  const decide = useCallback(async (decision: 'approve' | 'reject') => {
    if (!current || inFlight.includes(current.id)) return
    if (current.operation === 'delete' && decision === 'approve') {
      if (!window.confirm('Permanently delete this record? This cannot be undone.')) return
    }
    const selected = current
    setMessage('')
    setInFlight(ids => [...ids, selected.id])
    setPending(items => items.filter(item => item.id !== selected.id))
    setIndex(n => Math.max(0, Math.min(n, pending.length - 2)))
    setDetails(false)
    try {
      const result = await reviewMcpContent(selected.id, decision)
      if (!result.success) {
        setPending(items => [selected, ...items])
        setIndex(0)
        setMessage(result.error ?? 'The review failed. The request was restored.')
      } else {
        setHistory(items => [{ ...selected, status: decision === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }, ...items].slice(0, 30))
      }
    } catch {
      setPending(items => [selected, ...items])
      setIndex(0)
      setMessage('The connection failed. Check the proposal status before retrying.')
    } finally {
      setInFlight(ids => ids.filter(id => id !== selected.id))
      router.refresh()
    }
  }, [current, pending.length, inFlight, router])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowRight') move(1)
      if (event.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [move])

  return <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden" aria-label="AI content review">
    <header className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div>
        <p className="text-xs text-zinc-400">Pending proposals</p>
        <p className="text-lg font-semibold">{pending.length} awaiting review</p>
      </div>
      <p className="text-sm text-zinc-400">{pending.length ? (index + 1) + ' / ' + pending.length : 'Queue clear'}</p>
    </header>
    {message && <p role="alert" className="rounded-lg border border-red-700 px-3 py-2 text-red-300">{message}</p>}
    {current ? <article key={current.id} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-800 p-4">
        <p className="text-xs uppercase tracking-wide text-red-400">{label(current.collection)} · {label(current.operation)}</p>
        <h2 className="mt-1 break-words text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-xs text-zinc-500">Submitted {new Date(current.created_at).toLocaleString()}</p>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {current.operation === 'delete' && <p className="rounded border border-red-800 p-3 text-sm text-red-300">This proposal permanently deletes the selected record. Approval requires additional confirmation.</p>}
        {current.operation === 'delete' ? <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm text-zinc-300">{printValue(before)}</pre> : changes.map(([field, value]) => <section key={field} className="overflow-hidden rounded border border-zinc-800">
          <h3 className="bg-zinc-900 px-3 py-2 text-sm font-medium">{label(field)}</h3>
          <div className="grid gap-px bg-zinc-800 sm:grid-cols-2">
            {current.operation !== 'create' && <div className="bg-zinc-950 p-3">
              <p className="mb-2 text-xs uppercase text-zinc-500">Before</p>
              <pre className="whitespace-pre-wrap break-words text-xs text-zinc-400">{printValue(before[field])}</pre>
            </div>}
            <div className="bg-zinc-950 p-3">
              <p className="mb-2 text-xs uppercase text-red-400">Proposed</p>
              <pre className="whitespace-pre-wrap break-words text-xs">{printValue(value)}</pre>
            </div>
          </div>
        </section>)}
        <button type="button" onClick={() => setDetails(v => !v)} className="text-xs text-zinc-400 underline">{details ? 'Hide' : 'Show'} technical details</button>
        {details && <pre className="overflow-auto whitespace-pre-wrap break-words text-xs text-zinc-500">{JSON.stringify(current, null, 2)}</pre>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-900 p-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} disabled={index === 0} className="rounded border border-zinc-700 px-3 py-2 text-sm disabled:opacity-30">Back</button>
          <button type="button" onClick={() => move(1)} disabled={index >= pending.length - 1} className="rounded border border-zinc-700 px-3 py-2 text-sm disabled:opacity-30">Skip</button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void decide('reject')} className="rounded border border-red-800 px-4 py-2 text-sm font-medium text-red-300">Reject</button>
          <button type="button" onClick={() => void decide('approve')} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white">Accept</button>
        </div>
      </footer>
    </article> : <div className="rounded-lg border border-zinc-800 p-8 text-center text-zinc-400">No pending proposals. New MCP changes will appear here for review.</div>}
    {history.length > 0 && <details className="shrink-0 rounded border border-zinc-800 p-3 text-sm">
      <summary className="cursor-pointer text-zinc-300">Recent decisions ({history.length})</summary>
      <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-xs text-zinc-400">
        {history.map(row => <li key={row.id}>{label(row.collection)} · {label(row.operation)} · {label(row.status)} · {new Date(row.reviewed_at ?? row.created_at).toLocaleString()}</li>)}
      </ul>
    </details>}
  </section>
}
