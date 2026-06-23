'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import type { CatalogueSyncConfig } from '@/lib/catalogue-sync-config'

interface FieldDef {
  key: keyof CatalogueSyncConfig
  label: string
  placeholder: string
  hint?: string
}

const FIELDS: FieldDef[] = [
  {
    key: 'artistName',
    label: 'Artist name (fallback)',
    placeholder: 'Zardonic',
    hint: 'Used when a platform artist ID is empty, and as the default artist label on imports.',
  },
  {
    key: 'itunesArtistId',
    label: 'iTunes / Apple Music artist ID',
    placeholder: '261118434 or music.apple.com/artist/…',
  },
  {
    key: 'spotifyArtistId',
    label: 'Spotify artist ID',
    placeholder: '7BqEidErPMNiUXCRE0dV2n or open.spotify.com/artist/…',
  },
  {
    key: 'discogsArtistId',
    label: 'Discogs artist ID',
    placeholder: '12345 or discogs.com/artist/…',
  },
]

interface CatalogueSyncSettingsProps {
  initialConfig: CatalogueSyncConfig
}

export function CatalogueSyncSettings({ initialConfig }: CatalogueSyncSettingsProps) {
  const router = useRouter()
  const initial = useMemo(() => ({ ...initialConfig }), [initialConfig])
  const [values, setValues] = useState<CatalogueSyncConfig>(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', 'catalogue_sync')
    fd.set('value', JSON.stringify(values))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Platform artist IDs</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Saved here and used by Catalogue Sync. Paste a numeric ID or platform URL.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label htmlFor={`catalogue-${field.key}`} className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              {field.label}
            </label>
            <input
              id={`catalogue-${field.key}`}
              type="text"
              value={values[field.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
            {field.hint && <p className="text-xs text-zinc-600">{field.hint}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save artist IDs'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}