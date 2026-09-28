'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AdminSortableItem,
  AdminSortableList,
  rectSortingStrategy,
} from '@/app/admin/_components/AdminSortableList'
import { deleteGalleryImage } from '@/app/admin/_actions/gallery'
import { reorderGallery } from '@/app/admin/_actions/reorder'
import { resolveImageUrl } from '@/lib/r2'
import { toDirectImageUrl } from '@/lib/image-cache'
import { GalleryVisibilityToggle } from './GalleryVisibilityToggle'

export interface GalleryListRow {
  id: string
  alt: string | null
  storage_path: string | null
  image_url: string | null
  display_order: number
  active: boolean
}

export function GallerySortable({ initialImages }: { initialImages: GalleryListRow[] }) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(orderedIds: string[]) {
    const result = await reorderGallery(orderedIds)
    if (!result?.error) router.refresh()
    return result
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteGalleryImage(id)
    setDeletingId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    setImages((prev) => prev.filter((image) => image.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <AdminSortableList
        items={images}
        onItemsChange={setImages}
        onReorder={handleReorder}
        strategy={rectSortingStrategy}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
      >
        {(img) => {
          const src = resolveImageUrl(img.storage_path, img.image_url)
          return (
            <AdminSortableItem
              key={img.id}
              id={img.id}
              label={img.alt ?? 'gallery image'}
              className="overflow-hidden rounded border border-zinc-800 bg-zinc-900"
            >
              {(handle) => (
                <>
                  <div className="relative aspect-square bg-zinc-800">
                    {src ? (
                      <img
                        src={toDirectImageUrl(src, { w: 400 }) || src}
                        alt={img.alt ?? ''}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-xs text-zinc-600">
                        NO IMAGE
                      </div>
                    )}
                    <div className="absolute left-1 top-1 rounded bg-zinc-950/70 p-1">{handle}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <span className="truncate text-xs text-zinc-400">{img.alt ?? 'No alt'}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <GalleryVisibilityToggle imageId={img.id} active={img.active ?? true} />
                      <Link
                        href={`/admin/gallery/${img.id}`}
                        className="text-xs text-zinc-400 transition-colors hover:text-white"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(img.id)}
                        disabled={deletingId === img.id}
                        className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingId === img.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </AdminSortableItem>
          )
        }}
      </AdminSortableList>
    </div>
  )
}
