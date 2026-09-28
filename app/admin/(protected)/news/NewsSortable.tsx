'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSortableItem, AdminSortableList } from '@/app/admin/_components/AdminSortableList'
import { deleteNewsPost, toggleNewsPostVisibility } from '@/app/admin/_actions/news'
import { reorderNewsPosts } from '@/app/admin/_actions/reorder'
import { resolveImageUrl } from '@/lib/r2'
import { toDirectImageUrl } from '@/lib/image-cache'

export interface NewsListRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_storage_path: string | null
  cover_url: string | null
  published_at: string | null
  active: boolean
  display_order: number
}

export function NewsSortable({ initialPosts }: { initialPosts: NewsListRow[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(orderedIds: string[]) {
    const result = await reorderNewsPosts(orderedIds)
    if (!result?.error) router.refresh()
    return result
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteNewsPost(id)
    setDeletingId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    setPosts((prev) => prev.filter((post) => post.id !== id))
    router.refresh()
  }

  async function handleToggle(id: string, nextActive: boolean) {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, active: nextActive } : post)),
    )
    const result = await toggleNewsPostVisibility(id, nextActive)
    if (result?.error) {
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, active: !nextActive } : post)),
      )
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <AdminSortableList
        items={posts}
        onItemsChange={setPosts}
        onReorder={handleReorder}
        className="space-y-1.5"
      >
        {(post) => {
          const cover = resolveImageUrl(post.cover_storage_path, post.cover_url)
          return (
            <AdminSortableItem
              key={post.id}
              id={post.id}
              label={post.title}
              className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2"
            >
              {(handle) => (
                <>
                  {handle}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-zinc-800">
                    {cover ? (
                      <img
                        src={toDirectImageUrl(cover, { w: 96 }) || cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{post.title}</p>
                    <p className="truncate font-mono text-xs text-zinc-500">
                      {post.slug}
                      {post.published_at
                        ? ` · ${new Date(post.published_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(post.id, !post.active)}
                    className={`text-xs ${post.active ? 'text-green-400' : 'text-zinc-500'}`}
                  >
                    {post.active ? 'Visible' : 'Hidden'}
                  </button>
                  <Link href={`/admin/news/${post.id}`} className="text-xs text-zinc-400 hover:text-white">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === post.id ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              )}
            </AdminSortableItem>
          )
        }}
      </AdminSortableList>
    </div>
  )
}
