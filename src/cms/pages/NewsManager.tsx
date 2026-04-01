/**
 * NewsManager — list and manage news/blog posts.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useNews, useDeleteNewsPost } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface NewsPost { id: string; title: string; slug: string; isDraft: boolean; publishedAt?: string }

export function NewsManager() {
  const { data, isLoading } = useNews()
  const deletePost = useDeleteNewsPost()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const posts = (data ?? []) as NewsPost[]

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deletePost.mutateAsync(deleteId)
      toast.success('Post gelöscht')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="News"
        breadcrumbs={['CMS', 'News']}
        actions={
          <Link to="/cms/news/new" className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700">
            + NEW POST
          </Link>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <div className="text-zinc-500 font-mono text-sm">Lädt…</div>
        ) : posts.length === 0 ? (
          <div className="text-zinc-500 font-mono text-sm">Noch keine News-Posts.</div>
        ) : (
          <div className="border border-zinc-800 divide-y divide-zinc-800">
            {posts.map(post => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50">
                <div>
                  <div className="text-sm font-mono text-zinc-200">{post.title}</div>
                  <div className="text-xs font-mono text-zinc-500">/{post.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <DraftPublishToggle entity="news" id={post.id} isDraft={post.isDraft} />
                  <Link to={`/cms/news/${post.id}`} className="text-xs font-mono text-zinc-400 hover:text-white px-2 py-1 border border-zinc-700">EDIT</Link>
                  <button onClick={() => setDeleteId(post.id)} className="text-xs font-mono text-red-500 hover:text-red-300 px-2 py-1 border border-zinc-800 hover:border-red-800">DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Post löschen"
        description="Dieser News-Post wird dauerhaft gelöscht."
        onConfirm={() => { void handleDelete() }}
      />
    </div>
  )
}
