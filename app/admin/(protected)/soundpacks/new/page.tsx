'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { createSoundpack } from '@/app/admin/_actions/soundpacks'

export default function NewSoundpackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [storagePath, setStoragePath] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    if (storagePath) fd.set('image_storage_path', storagePath)
    const result = await createSoundpack(fd)
    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/admin/soundpacks')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">New Soundpack</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title</label>
          <input
            name="title"
            required
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-2">Cover Image</label>
          <ImageUploader label="Upload Image" onUpload={setStoragePath} onError={setError} />
          <p className="text-xs text-zinc-500 mt-1">Or paste a direct image URL below.</p>
          <input
            name="image_url"
            type="url"
            placeholder="https://…"
            className="mt-1 w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
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
