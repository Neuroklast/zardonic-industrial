'use client'

import { useState } from 'react'
import { createPartner } from '@/app/admin/_actions/partners'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { useRouter } from 'next/navigation'

export default function PartnerForm() {
  const router = useRouter()
  const [logoPath, setLogoPath] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (logoPath) {
      formData.set('logo_storage_path', logoPath)
      formData.set('logo_url', '')
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Name *</label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Section</label>
          <select
            name="category"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
          >
            <option value="credit">Credit (Credits grid)</option>
            <option value="endorsement">Endorsement (Endorsements grid)</option>
            <option value="partner">Partner / Friend</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Website URL</label>
        <input
          name="url"
          type="url"
          placeholder="https://…"
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
        />
      </div>
      <MediaSourcePicker
        label="Logo"
        storagePrefix="partners/logos"
        onResolved={(path) => {
          setLogoPath(path)
          setError(null)
        }}
        onError={(msg) => setError(msg)}
      />
      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
        <input
          type="checkbox"
          name="logo_hover_white"
          value="true"
          className="rounded border-zinc-600"
        />
        White logo (permanent, transparent background)
      </label>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit"
        className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors"
      >
        Add Partner
      </button>
    </form>
  )
}