'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { updateNewsPost } from '@/app/admin/_actions/news'
import { resolveImageUrl } from '@/lib/r2'

interface NewsPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string
  cover_storage_path: string | null
  cover_url: string | null
  published_at: string | null
  active: boolean
  display_order: number
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditNewsForm({ post }: { post: NewsPost }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [storagePath, setStoragePath] = useState<string | null>(post.cover_storage_path)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    if (storagePath) {
      fd.set('cover_storage_path', storagePath)
      fd.set('cover_url', '')
    }
    fd.set('active', fd.get('active') ? 'true' : 'false')
    const result = await updateNewsPost(post.id, fd)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    router.push('/admin/news')
    router.refresh()
  }

  const currentCover = resolveImageUrl(storagePath, post.cover_url)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Title *</label>
        <input
          name="title"
          required
          defaultValue={post.title}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Slug</label>
        <input
          name="slug"
          defaultValue={post.slug}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Excerpt</label>
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={post.excerpt ?? ''}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Body</label>
        <textarea
          name="body"
          rows={10}
          defaultValue={post.body}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <MediaSourcePicker
        label="Cover image"
        storagePrefix="news"
        currentUrl={currentCover}
        editorAspectRatio={16 / 9}
        onResolved={(path) => setStoragePath(path)}
        onError={setError}
      />
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Published at</label>
        <input
          name="published_at"
          type="datetime-local"
          defaultValue={toLocalInputValue(post.published_at)}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Display order</label>
        <input
          name="display_order"
          type="number"
          defaultValue={post.display_order}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input name="active" type="checkbox" defaultChecked={post.active} />
        Visible on site
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-zinc-700 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
