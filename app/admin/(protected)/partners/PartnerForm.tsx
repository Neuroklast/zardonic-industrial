'use client'

import { useState } from 'react'
import { createPartner } from '@/app/admin/_actions/partners'
import { ImageUploader } from '@/app/admin/_components/ImageUploader'
import { useRouter } from 'next/navigation'

export default function PartnerForm() {
  const router = useRouter()
  const [logoPath, setLogoPath] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (logoPath) formData.set('logo_storage_path', logoPath)
    const result = await createPartner(formData)
    if (result?.error) setError(result.error)
    else {
      ;(e.target as HTMLFormElement).reset()
      setLogoPath('')
      setError(null)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Name *</label>
          <input name="name" required className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Category</label>
          <select name="category" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none">
            <option value="partner">Partner</option>
            <option value="label">Label</option>
            <option value="sponsor">Sponsor</option>
            <option value="friend">Friend</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Website URL</label>
        <input name="url" type="url" className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-2">Logo</label>
        <ImageUploader
          label="Upload Logo"
          onUpload={(path) => setLogoPath(path)}
          onError={(msg) => setError(msg)}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">Add Partner</button>
    </form>
  )
}
