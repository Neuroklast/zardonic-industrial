'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateMusicHighlight } from '@/app/admin/_actions/musicHighlights'

interface Item {
  id: string
  title: string
  youtube_url: string
  description: string | null
  display_order: number
}

export default function EditMusicHighlightForm({ item }: { item: Item }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await updateMusicHighlight(item.id, new FormData(e.currentTarget))
    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/music-highlights')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Title</label>
        <input
          name="title"
          defaultValue={item.title}
          required
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">YouTube URL</label>
        <input
          name="youtube_url"
          type="url"
          defaultValue={item.youtube_url}
          required
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Description (optional)</label>
        <textarea
          name="description"
          defaultValue={item.description ?? ''}
          rows={3}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Display Order</label>
        <input
          name="display_order"
          type="number"
          defaultValue={item.display_order}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
