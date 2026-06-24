'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FloppyDisk } from '@phosphor-icons/react'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'

interface TranslationsEditorProps {
  strings: Record<string, { de: string; en: string }>
  defaultStrings: Record<string, { de: string; en: string }>
}

export default function TranslationsEditor({ strings, defaultStrings }: TranslationsEditorProps) {
  const router = useRouter()
  const [values, setValues] = useState(strings)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function updateField(key: string, locale: 'en' | 'de', value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], [locale]: value },
    }))
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)

    const overrides: Record<string, Record<string, string>> = {}
    for (const key of Object.keys(defaultStrings)) {
      const entry = values[key]
      if (!entry) continue
      const en = entry.en?.trim()
      const de = entry.de?.trim()
      const def = defaultStrings[key]
      const patch: Record<string, string> = {}
      if (en && en !== def.en) patch.en = en
      if (de && de !== def.de) patch.de = de
      if (Object.keys(patch).length > 0) {
        overrides[key] = patch
      }
    }

    const fd = new FormData()
    fd.set('key', 'translations')
    fd.set('value', JSON.stringify(overrides))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }

    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 px-4 py-2">
          <span>Key</span>
          <span>English</span>
          <span>Deutsch</span>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {Object.entries(values).map(([key, entry]) => (
            <div key={key} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 px-4 py-2">
              <code className="font-mono text-xs text-zinc-400 truncate" title={key}>{key}</code>
              <input
                type="text"
                value={entry.en}
                onChange={(e) => updateField(key, 'en', e.target.value)}
                placeholder={defaultStrings[key]?.en ?? ''}
                aria-label={`${key} English`}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-full"
              />
              <input
                type="text"
                value={entry.de}
                onChange={(e) => updateField(key, 'de', e.target.value)}
                placeholder={defaultStrings[key]?.de ?? ''}
                aria-label={`${key} Deutsch`}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors"
        >
          <FloppyDisk className="h-4 w-4" aria-hidden="true" />
          {status === 'saving' ? 'Saving…' : 'Save Translations'}
        </button>
      </div>
    </div>
  )
}