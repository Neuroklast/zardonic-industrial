'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { createMerchandise } from '@/app/admin/_actions/merchandise'

export default function NewMerchandisePage() {
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
      fd.set('image_storage_path', storagePath)
      fd.set('image_url', '')
    }
    const result = await createMerchandise(fd)
    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/merchandise')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">New Merchandise Item</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title</label>
          <input
            name="title"
            required
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <MediaSourcePicker
          label="Cover Image"
          storagePrefix="merchandise"
          onResolved={(path) => {
            setStoragePath(path)
            setError(null)
          }}
          onError={setError}
        />
        <div>
          <label className="block text-sm text-zinc-300 mb-1">External Link URL</label>
          <input
            name="external_url"
            type="url"
            placeholder="https://…"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Display Order</label>
          <input
            name="display_order"
            type="number"
            defaultValue={0}
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
    </div>
  )
}