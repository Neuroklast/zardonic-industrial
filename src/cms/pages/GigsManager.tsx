/**
 * GigsManager — list and manage tour dates.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useGigs, useDeleteGig } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Gig {
  id: string
  title: string
  venue: string
  city: string
  country: string
  date: string
  isDraft: boolean
  isCancelled: boolean
  isSoldOut: boolean
}

export function GigsManager() {
  const { data, isLoading } = useGigs()
  const deleteGig = useDeleteGig()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const gigs = (data ?? []) as Gig[]

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteGig.mutateAsync(deleteId)
      toast.success('Gig gelöscht')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Tour Dates"
        breadcrumbs={['CMS', 'Gigs']}
        actions={
          <Link to="/cms/gigs/new" className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700">
            + NEW GIG
          </Link>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : gigs.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Noch keine Gigs.</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {gigs.map(gig => (
              <div key={gig.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50">
                <div>
                  <div className="text-sm font-mono text-zinc-200">{gig.title}</div>
                  <div className="text-xs font-mono text-zinc-500">
                    {new Date(gig.date).toLocaleDateString('de-DE')} · {gig.venue}, {gig.city}, {gig.country}
                    {gig.isCancelled && <span className="ml-2 text-red-500">CANCELLED</span>}
                    {gig.isSoldOut && <span className="ml-2 text-yellow-500">SOLD OUT</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DraftPublishToggle entity="gig" id={gig.id} isDraft={gig.isDraft} />
                  <Link to={`/cms/gigs/${gig.id}`} className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 border border-zinc-700">
                    EDIT
                  </Link>
                  <button
                    onClick={() => setDeleteId(gig.id)}
                    className="text-xs font-mono text-red-500 hover:text-red-300 px-2 py-1 border border-zinc-800 hover:border-red-800"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Gig löschen"
        description="Dieser Tour-Termin wird dauerhaft gelöscht."
        onConfirm={() => { void handleDelete() }}
      />
    </div>
  )
}
