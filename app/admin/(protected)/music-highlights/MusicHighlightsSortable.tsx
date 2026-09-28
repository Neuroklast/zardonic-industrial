'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSortableItem, AdminSortableList } from '@/app/admin/_components/AdminSortableList'
import { deleteMusicHighlight } from '@/app/admin/_actions/musicHighlights'
import { reorderMusicHighlights } from '@/app/admin/_actions/reorder'

export interface MusicHighlightListRow {
  id: string
  title: string
  youtube_url: string
  display_order: number
}

export function MusicHighlightsSortable({
  initialItems,
}: {
  initialItems: MusicHighlightListRow[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(orderedIds: string[]) {
    const result = await reorderMusicHighlights(orderedIds)
    if (!result?.error) router.refresh()
    return result
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteMusicHighlight(id)
    setDeletingId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <AdminSortableList
        items={items}
        onItemsChange={setItems}
        onReorder={handleReorder}
        className="space-y-1.5"
      >
        {(item) => (
          <AdminSortableItem
            key={item.id}
            id={item.id}
            label={item.title}
            className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2"
          >
            {(handle) => (
              <>
                {handle}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">{item.title}</p>
                  <p className="truncate text-xs text-zinc-500">{item.youtube_url}</p>
                </div>
                <Link
                  href={`/admin/music-highlights/${item.id}`}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deletingId === item.id ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
          </AdminSortableItem>
        )}
      </AdminSortableList>
    </div>
  )
}
