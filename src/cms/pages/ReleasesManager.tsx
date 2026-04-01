/**
 * ReleasesManager — list, sort, and manage releases.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useReleases, useDeleteRelease } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Release {
  id: string
  title: string
  type: string
  isDraft: boolean
  releaseDate?: string
  coverUrl?: string
}

export function ReleasesManager() {
  const { data, isLoading } = useReleases()
  const deleteRelease = useDeleteRelease()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const releases = (data ?? []) as Release[]

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteRelease.mutateAsync(deleteId)
      toast.success('Release gelöscht')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Releases"
        breadcrumbs={['CMS', 'Releases']}
        actions={
          <Link to="/cms/releases/new" className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700">
            + NEW RELEASE
          </Link>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : releases.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Noch keine Releases.</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {releases.map(release => (
              <div key={release.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  {release.coverUrl && (
                    <img src={release.coverUrl} alt="" className="w-10 h-10 object-cover border border-zinc-700" />
                  )}
                  <div>
                    <div className="text-sm font-mono text-zinc-200">{release.title}</div>
                    <div className="text-xs font-mono text-zinc-500">
                      {release.type.toUpperCase()}
                      {release.releaseDate && ` · ${new Date(release.releaseDate).getFullYear()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DraftPublishToggle entity="release" id={release.id} isDraft={release.isDraft} />
                  <Link to={`/cms/releases/${release.id}`} className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 border border-zinc-700">
                    EDIT
                  </Link>
                  <button
                    onClick={() => setDeleteId(release.id)}
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
        title="Release löschen"
        description="Dieser Release wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={() => { void handleDelete() }}
      />
    </div>
  )
}
