'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updatePartner } from '@/app/admin/_actions/partners'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'

interface EditPartnerFormProps {
  partner: {
    id: string
    name: string
    url: string | null
    category: string
    logo_storage_path: string | null
    display_order: number
    active: boolean
  }
  resolvedLogoUrl?: string | null
}

export function EditPartnerForm({ partner, resolvedLogoUrl }: EditPartnerFormProps) {
  const router = useRouter()
  const [logoPath, setLogoPath] = useState(partner.logo_storage_path ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (logoPath) {
      formData.set('logo_storage_path', logoPath)
      formData.set('logo_url', '')
    }
    const result = await updatePartner(partner.id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      router.push('/admin/partners')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Name *</label>
          <input
            name="name"
            required
            defaultValue={partner.name}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Section</label>
          <select
            name="category"
            defaultValue={partner.category}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
          >
            <option value="credit">Credit</option>
            <option value="endorsement">Endorsement</option>
            <option value="partner">Partner / Friend</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Website URL</label>
        <input
          name="url"
          type="url"
          defaultValue={partner.url ?? ''}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Display order</label>
        <input
          name="display_order"
          type="number"
          defaultValue={partner.display_order}
          className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm"
        />
      </div>
      <MediaSourcePicker
        label="Logo"
        currentUrl={resolvedLogoUrl}
        storagePrefix={`partners/logos/${partner.id}`}
        onResolved={(path) => {
          setLogoPath(path)
          setError(null)
        }}
        onError={(msg) => setError(msg)}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border border-zinc-700 text-zinc-300 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}