'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSortableItem, AdminSortableList } from '@/app/admin/_components/AdminSortableList'
import { deleteMediaDownload } from '@/app/admin/_actions/mediaDownloads'
import { reorderMediaDownloads } from '@/app/admin/_actions/reorder'
import { resolveImageUrl } from '@/lib/r2'
import { formatFileSize, mediaKindFromMime, parseMediaCategory } from '@/lib/media-download'
import { toDirectImageUrl } from '@/lib/image-cache'
import { MediaVisibilityToggle } from './MediaVisibilityToggle'

export interface MediaListRow {
  id: string
  title: string
  category: string | null
  file_storage_path: string | null
  file_url: string | null
  file_mime: string | null
  file_size_bytes: number | null
  original_filename: string | null
  display_order: number
  active: boolean
}

export function MediaSortable({ initialItems }: { initialItems: MediaListRow[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(orderedIds: string[]) {
    const result = await reorderMediaDownloads(orderedIds)
    if (!result?.error) router.refresh()
    return result
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteMediaDownload(id)
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
        {(item) => {
          const src = resolveImageUrl(item.file_storage_path, item.file_url)
          const kind = mediaKindFromMime(item.file_mime, item.original_filename)
          return (
            <AdminSortableItem
              key={item.id}
              id={item.id}
              label={item.title}
              className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2"
            >
              {(handle) => (
                <>
                  {handle}
                  {kind === 'image' && src ? (
                    <img
                      src={toDirectImageUrl(src, { w: 80 }) || src}
                      alt=""
                      className="h-10 w-10 rounded border border-zinc-800 object-cover"
                    />
                  ) : (
                    <span className="w-10 font-mono text-xs text-zinc-500">{kind}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{item.title}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {parseMediaCategory(item.category)} · {formatFileSize(item.file_size_bytes)}
                    </p>
                  </div>
                  <MediaVisibilityToggle itemId={item.id} active={item.active ?? true} />
                  <Link href={`/admin/media/${item.id}`} className="text-xs text-zinc-400 hover:text-white">
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
          )
        }}
      </AdminSortableList>
    </div>
  )
}
