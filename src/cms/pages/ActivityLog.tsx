/**
 * ActivityLog — admin audit trail viewer.
 */

import { useState } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { useActivityLog } from '../hooks/useCmsApi'

const PAGE_SIZE = 50

export function ActivityLogPage() {
  const [offset, setOffset] = useState(0)
  const [entityFilter, setEntityFilter] = useState('')

  const { data, isLoading } = useActivityLog({
    limit: PAGE_SIZE,
    offset,
    entity: entityFilter || undefined,
  })

  interface ActivityData {
    logs: Array<{ id: string; action: string; entity: string; entityId?: string; details?: string; ipHash?: string; createdAt: string }>
    total: number
  }

  const activityData = data as ActivityData | undefined
  const logs = activityData?.logs ?? []
  const total = activityData?.total ?? 0

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar title="Activity Log" breadcrumbs={['CMS', 'Activity']} />
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setOffset(0) }}
            placeholder="Filter by entity (release, gig, …)"
            className="bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-1.5 focus:outline-none focus:border-red-600 w-60"
          />
          <span className="text-xs font-mono text-zinc-600 self-center">Total: {total}</span>
        </div>

        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : logs.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Keine Einträge.</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span className="text-red-400 uppercase w-20">{log.action}</span>
                  <span className="text-zinc-400 w-24">{log.entity}</span>
                  {log.entityId && <span className="text-zinc-600">{log.entityId.slice(0, 12)}</span>}
                  {log.details && <span className="text-zinc-600 italic">{log.details}</span>}
                </div>
                <div className="flex items-center gap-4 text-zinc-600">
                  {log.ipHash && <span>IP: {log.ipHash.slice(0, 8)}</span>}
                  <span>{new Date(log.createdAt).toLocaleString('de-DE')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex gap-3 mt-4">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="px-3 py-1 text-xs font-mono border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30"
            >
              ← PREV
            </button>
            <span className="text-xs font-mono text-zinc-600 self-center">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}</span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-3 py-1 text-xs font-mono border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
