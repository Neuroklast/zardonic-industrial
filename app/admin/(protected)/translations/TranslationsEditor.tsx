'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FloppyDisk, Plus, Trash } from '@phosphor-icons/react'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'
import { isValidLocaleCode } from '@/lib/languages-config'
import type { SiteLanguage } from '@/lib/i18n'

interface TranslationsEditorProps {
  strings: Record<string, Record<string, string>>
  defaultStrings: Record<string, Record<string, string>>
  languages: SiteLanguage[]
}

export default function TranslationsEditor({
  strings,
  defaultStrings,
  languages: initialLanguages,
}: TranslationsEditorProps) {
  const router = useRouter()
  const [values, setValues] = useState(strings)
  const [languages, setLanguages] = useState<SiteLanguage[]>(initialLanguages)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function updateField(key: string, locale: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], [locale]: value },
    }))
  }

  function addLanguage() {
    const code = newCode.trim().toLowerCase()
    const label = newLabel.trim()
    setAddError(null)

    if (!code) {
      setAddError('Enter a locale code (e.g. fr, nl, pt-br).')
      return
    }
    if (!isValidLocaleCode(code)) {
      setAddError('Invalid code. Use 2-letter ISO codes or regional variants (e.g. pt-br).')
      return
    }
    if (languages.some((l) => l.code === code)) {
      setAddError('This language is already configured.')
      return
    }

    const nextLanguage: SiteLanguage = { code, label: label || code.toUpperCase(), flag: '' }
    setLanguages((prev) => [...prev, nextLanguage])
    setValues((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(defaultStrings)) {
        const defaults = defaultStrings[key]
        next[key] = {
          ...next[key],
          [code]: defaults[code] ?? defaults.en ?? '',
        }
      }
      return next
    })
    setNewCode('')
    setNewLabel('')
  }

  function removeLanguage(code: string) {
    if (languages.length <= 1) return
    setLanguages((prev) => prev.filter((l) => l.code !== code))
    setValues((prev) => {
      const next: Record<string, Record<string, string>> = {}
      for (const [key, entry] of Object.entries(prev)) {
        const { [code]: _removed, ...rest } = entry
        next[key] = rest
      }
      return next
    })
  }

  async function saveConfig(key: string, value: unknown): Promise<{ error?: string }> {
    const fd = new FormData()
    fd.set('key', key)
    fd.set('value', JSON.stringify(value))
    return updateSiteConfig(fd)
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)

    const overrides: Record<string, Record<string, string>> = {}
    for (const key of Object.keys(defaultStrings)) {
      const entry = values[key]
      if (!entry) continue
      const def = defaultStrings[key]
      const patch: Record<string, string> = {}
      for (const lang of languages) {
        const value = entry[lang.code]?.trim()
        const fallback = def[lang.code] ?? def.en ?? ''
        if (value && value !== fallback) {
          patch[lang.code] = value
        }
      }
      if (Object.keys(patch).length > 0) {
        overrides[key] = patch
      }
    }

    const languagesPayload = languages.map(({ code, label }) => ({ code, label }))

    const translationsResult = await saveConfig('translations', overrides)
    if (translationsResult.error) {
      setStatus('error')
      setErrorMsg(translationsResult.error)
      return
    }

    const languagesResult = await saveConfig('languages', languagesPayload)
    if (languagesResult.error) {
      setStatus('error')
      setErrorMsg(languagesResult.error)
      return
    }

    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  const gridCols = `minmax(8rem,1fr) repeat(${languages.length}, minmax(8rem, 1fr))`

  return (
    <div>
      <div className="mb-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Languages</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {languages.map((lang) => (
            <span
              key={lang.code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200"
            >
              <code className="font-mono text-xs text-zinc-400">{lang.code}</code>
              <span>{lang.label}</span>
              {languages.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeLanguage(lang.code)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${lang.label}`}
                >
                  <Trash className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Code
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="fr"
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-24 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Label
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Français"
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-40"
            />
          </label>
          <button
            type="button"
            onClick={addLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add language
          </button>
        </div>
        {addError ? <p className="mt-2 text-xs text-red-400">{addError}</p> : null}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
        <div
          className="grid text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 px-4 py-2 gap-2 min-w-max"
          style={{ gridTemplateColumns: gridCols }}
        >
          <span>Key</span>
          {languages.map((lang) => (
            <span key={lang.code}>{lang.label}</span>
          ))}
        </div>
        <div className="divide-y divide-zinc-800/60">
          {Object.entries(values).map(([key, entry]) => (
            <div
              key={key}
              className="grid items-center gap-2 px-4 py-2 min-w-max"
              style={{ gridTemplateColumns: gridCols }}
            >
              <code className="font-mono text-xs text-zinc-400 truncate" title={key}>
                {key}
              </code>
              {languages.map((lang) => {
                const placeholder = defaultStrings[key]?.[lang.code] ?? defaultStrings[key]?.en ?? ''
                return (
                  <input
                    key={lang.code}
                    type="text"
                    value={entry[lang.code] ?? ''}
                    onChange={(e) => updateField(key, lang.code, e.target.value)}
                    placeholder={placeholder}
                    aria-label={`${key} ${lang.label}`}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 w-full"
                  />
                )
              })}
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