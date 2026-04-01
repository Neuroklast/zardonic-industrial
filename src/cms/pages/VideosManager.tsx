/**
 * VideosManager — list and manage videos.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useVideos, useDeleteVideo } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Video {
  id: string
  title: string
  youtubeId?: string
  category?: string
  isDraft: boolean
  featured: boolean
}

export function VideosManager() {
  const { data, isLoading } = useVideos()
  const deleteVideo = useDeleteVideo()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const videos = (data ?? []) as Video[]

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteVideo.mutateAsync(deleteId)
      toast.success('Video gelöscht')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Videos"
        breadcrumbs={['CMS', 'Videos']}
        actions={
          <Link to="/cms/videos/new" className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700">
            + NEW VIDEO
          </Link>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : videos.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Noch keine Videos.</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {videos.map(video => (
              <div key={video.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50">
                <div>
                  <div className="text-sm font-mono text-zinc-200">{video.title}</div>
                  <div className="text-xs font-mono text-zinc-500">
                    {video.youtubeId && `YT: ${video.youtubeId}`}
                    {video.category && ` · ${video.category}`}
                    {video.featured && ' · ★ FEATURED'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DraftPublishToggle entity="video" id={video.id} isDraft={video.isDraft} />
                  <Link to={`/cms/videos/${video.id}`} className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 border border-zinc-700">
                    EDIT
                  </Link>
                  <button
                    onClick={() => setDeleteId(video.id)}
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
        title="Video löschen"
        description="Dieses Video wird dauerhaft gelöscht."
        onConfirm={() => { void handleDelete() }}
      />
    </div>
  )
}
