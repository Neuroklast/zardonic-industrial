'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { createNewsPost } from '@/app/admin/_actions/news'

export default function NewNewsPostPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [storagePath, setStoragePath] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    if (storagePath) {
      fd.set('cover_storage_path', storagePath)
      fd.set('cover_url', '')
    }
    fd.set('active', 'true')
    const result = await createNewsPost(fd)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    router.push('/admin/news')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold">New News Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Title *</label>
          <input
            name="title"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Slug (optional)</label>
          <input
            name="slug"
            placeholder="auto-from-title"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Excerpt</label>
          <textarea
            name="excerpt"
            rows={2}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Body</label>
          <textarea
            name="body"
            rows={8}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        <MediaSourcePicker
          label="Cover image"
          storagePrefix="news"
          editorAspectRatio={16 / 9}
          onResolved={(path) => setStoragePath(path)}
          onError={setError}
        />
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Published at</label>
          <input
            name="published_at"
            type="datetime-local"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Display order</label>
          <input
            name="display_order"
            type="number"
            defaultValue={0}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-700 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/news')}
            className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
