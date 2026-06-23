'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { broadcastAdminDraft } from '@/lib/admin-draft-channel'
import type { AdminDraftKey } from '@/lib/admin-draft-channel'

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'url'
  placeholder?: string
}

interface SimpleTextConfigEditorProps {
  configKey: AdminDraftKey
  title: string
  description: string
  fields: FieldDef[]
  currentValue: Record<string, unknown>
}

export function SimpleTextConfigEditor({
  configKey,
  title,
  description,
  fields,
  currentValue,
}: SimpleTextConfigEditorProps) {
  const router = useRouter()
  const initial = useMemo(() => {
    const values: Record<string, string> = {}
    for (const field of fields) {
      values[field.key] = typeof currentValue[field.key] === 'string' ? (currentValue[field.key] as string) : ''
    }
    return values
  }, [currentValue, fields])

  const [values, setValues] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function updateField(key: string, value: string) {
    const next = { ...values, [key]: value }
    setValues(next)
    broadcastAdminDraft(configKey, next)
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('key', configKey)
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
    <div className="border border-zinc-800 rounded p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="block text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.key] ?? ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={3}
                placeholder={field.placeholder}
                className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600 resize-none"
              />
            ) : (
              <input
                type={field.type === 'url' ? 'url' : 'text'}
                value={values[field.key] ?? ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-zinc-600"
              />
            )}
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
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}