'use client'

import { useState } from 'react'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'

interface SiteConfigEditorProps {
  configKey: string
  label: string
  description: string
  example: string
  currentValue: string
}

export default function SiteConfigEditor({
  configKey,
  label,
  description,
  example,
  currentValue,
}: SiteConfigEditorProps) {
  const [value, setValue] = useState(currentValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', configKey)
    fd.set('value', value)
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="border border-zinc-800 rounded p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">{label}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        spellCheck={false}
        className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600 resize-y"
        placeholder={example}
        aria-label={`Edit ${label}`}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && (
          <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>
        )}
      </div>
    </div>
  )
}
