'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateApiSecrets } from '@/app/admin/_actions/apiSecrets'
import {
  API_SECRET_GROUPS,
  type ApiSecretKey,
} from '@/lib/api-secrets'

interface ApiKeysEditorProps {
  initialStatus: Record<ApiSecretKey, boolean>
  encryptionReady: boolean
}

type FieldState = {
  value: string
  clear: boolean
}

function buildInitialFields(): Record<ApiSecretKey, FieldState> {
  const fields = {} as Record<ApiSecretKey, FieldState>
  for (const group of API_SECRET_GROUPS) {
    for (const field of group.fields) {
      fields[field.key] = { value: '', clear: false }
    }
  }
  return fields
}

export function ApiKeysEditor({ initialStatus, encryptionReady }: ApiKeysEditorProps) {
  const router = useRouter()
  const [fields, setFields] = useState<Record<ApiSecretKey, FieldState>>(buildInitialFields)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const hasChanges = useMemo(() => {
    return Object.values(fields).some((f) => f.value.trim().length > 0 || f.clear)
  }, [fields])

  function updateField(key: ApiSecretKey, patch: Partial<FieldState>) {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }))
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)

    const fd = new FormData()
    for (const group of API_SECRET_GROUPS) {
      for (const field of group.fields) {
        const state = fields[field.key]
        if (state.value.trim()) {
          fd.set(field.key, state.value.trim())
        }
        if (state.clear) {
          fd.set(`clear_${field.key}`, '1')
        }
      }
    }

    const result = await updateApiSecrets(fd)
    if ('error' in result && result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      return
    }

    setFields(buildInitialFields())
    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  const inputClass =
    'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 font-mono'

  return (
    <div className="space-y-6">
      {!encryptionReady && (
        <div
          role="alert"
          className="rounded border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
        >
          <p className="font-semibold">Encryption key missing</p>
          <p className="mt-1 text-amber-200/80">
            Set <code className="font-mono text-xs">SECRETS_ENCRYPTION_KEY</code> (64 hex chars) in
            Vercel before saving keys. Existing env-var keys still work as fallback until migrated.
          </p>
        </div>
      )}

      <p className="text-sm text-zinc-500">
        Leave a field empty to keep the current value. Check &quot;Remove&quot; to delete a stored
        key. Env-var fallbacks are used when no DB value exists.
      </p>

      {API_SECRET_GROUPS.map((group) => (
        <section
          key={group.id}
          className="rounded border border-zinc-800 bg-zinc-950/60 overflow-hidden"
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">{group.label}</h2>
            {group.description && (
              <p className="mt-0.5 text-xs text-zinc-500">{group.description}</p>
            )}
          </div>
          <div className="divide-y divide-zinc-800/80">
            {group.fields.map((field) => {
              const configured = initialStatus[field.key]
              const state = fields[field.key]
              return (
                <div key={field.key} className="px-4 py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={field.key} className="text-sm font-medium text-zinc-300">
                      {field.label}
                    </label>
                    <span
                      className={[
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        configured
                          ? 'bg-green-900/40 text-green-400 border border-green-800'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700',
                      ].join(' ')}
                    >
                      {configured ? 'Configured' : 'Not set'}
                    </span>
                  </div>
                  {field.description && (
                    <p className="text-xs text-zinc-600">{field.description}</p>
                  )}
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.sensitive ? 'password' : 'text'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={configured ? 'Enter new value to replace' : 'Enter value'}
                    value={state.value}
                    onChange={(e) => updateField(field.key, { value: e.target.value })}
                    disabled={!encryptionReady || state.clear}
                    className={inputClass}
                  />
                  {configured && (
                    <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.clear}
                        onChange={(e) =>
                          updateField(field.key, { clear: e.target.checked, value: '' })
                        }
                        disabled={!encryptionReady}
                        className="rounded border-zinc-600"
                      />
                      Remove stored key
                    </label>
                  )}
                  <p className="text-[10px] font-mono text-zinc-600">
                    Env fallback: {field.envVar}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!encryptionReady || !hasChanges || status === 'saving'}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'saving' ? 'Saving…' : 'Save API Keys'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-400">Saved successfully.</span>
        )}
        {status === 'error' && errorMsg && (
          <span className="text-sm text-red-400">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}