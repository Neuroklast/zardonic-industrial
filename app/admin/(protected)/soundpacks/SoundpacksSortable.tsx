'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminSortableItem, AdminSortableList } from '@/app/admin/_components/AdminSortableList'
import { deleteSoundpack } from '@/app/admin/_actions/soundpacks'
import { reorderSoundpacks } from '@/app/admin/_actions/reorder'

export interface SoundpackListRow {
  id: string
  title: string
  display_order: number
}

export function SoundpacksSortable({ initialItems }: { initialItems: SoundpackListRow[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(orderedIds: string[]) {
    const result = await reorderSoundpacks(orderedIds)
    if (!result?.error) router.refresh()
    return result
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteSoundpack(id)
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
                <p className="min-w-0 flex-1 truncate text-sm text-zinc-200">{item.title}</p>
                <Link
                  href={`/admin/soundpacks/${item.id}`}
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
