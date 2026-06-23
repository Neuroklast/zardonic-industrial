'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { updateGalleryImage } from '@/app/admin/_actions/gallery'
import { resolveImageUrl } from '@/lib/r2'

interface GalleryItem {
  id: string
  alt: string | null
  caption: string | null
  storage_path: string | null
  image_url: string | null
  display_order: number
}

export default function EditGalleryForm({ item }: { item: GalleryItem }) {
  const router = useRouter()
  const [storagePath, setStoragePath] = useState(item.storage_path ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const currentUrl = resolveImageUrl(storagePath || item.storage_path, item.image_url)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!storagePath) {
      setError('Please add an image')
      return
    }
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('storage_path', storagePath)
    fd.set('image_url', '')
    const result = await updateGalleryImage(item.id, fd)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/gallery')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MediaSourcePicker
        label="Image"
        currentUrl={currentUrl}
        storagePrefix={`gallery/${item.id}`}
        onResolved={(path) => {
          setStoragePath(path)
          setError(null)
        }}
        onError={setError}
      />
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Alt Text</label>
        <input
          name="alt"
          defaultValue={item.alt ?? ''}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Caption</label>
        <input
          name="caption"
          defaultValue={item.caption ?? ''}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Display Order</label>
        <input
          name="display_order"
          type="number"
          defaultValue={item.display_order}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}