'use client'

import { useRouter } from 'next/navigation'
import { createRelease } from '@/app/admin/_actions/releases'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { useState } from 'react'

export default function NewReleasePage() {
  const router = useRouter()
  const [coverPath, setCoverPath] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (coverPath) formData.set('cover_storage_path', coverPath)

    const result = await createRelease(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      router.push('/admin/releases')
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">New Release</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title *</label>
          <input name="title" required className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Type</label>
          <select name="type" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none">
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
            <option value="remix">Remix</option>
            <option value="compilation">Compilation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Release Date</label>
          <input name="release_date" type="date" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Artists (comma separated)</label>
          <input name="artists" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" placeholder="Zardonic, Guest Artist" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-2">Cover Art</label>
          <ImageUploader
            label="Upload Cover"
            onUpload={(path) => setCoverPath(path)}
            onError={(msg) => setError(msg)}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">
            Create Release
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
