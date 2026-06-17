'use client'

import { useRouter } from 'next/navigation'
import { saveGalleryImage } from '@/app/admin/_actions/gallery'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { useState } from 'react'

export default function NewGalleryImagePage() {
  const router = useRouter()
  const [storagePath, setStoragePath] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!storagePath) {
      setError('Please upload an image first')
      return
    }
    const formData = new FormData(e.currentTarget)
    formData.set('storage_path', storagePath)
    const result = await saveGalleryImage(formData)
    if (result?.error) setError(result.error)
    else router.push('/admin/gallery')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Upload Gallery Image</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-2">Image *</label>
          <ImageUploader
            label="Select Image"
            onUpload={(path) => setStoragePath(path)}
            onError={(msg) => setError(msg)}
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Alt Text</label>
          <input name="alt" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Caption</label>
          <input name="caption" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">Save Image</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
