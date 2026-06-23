'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload } from '@phosphor-icons/react'
import { importSiteData } from '@/app/admin/_actions/dataImport'

export function DataImportClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(
      'Import will upsert data from this JSON file into Supabase. Continue?',
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    setMessage(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      startTransition(async () => {
        const result = await importSiteData(text)
        if (!result.ok) {
          setError(result.error ?? 'Import failed')
        } else {
          const summary = Object.entries(result.imported ?? {})
            .map(([table, count]) => `${table}: ${count}`)
            .join(', ')
          setMessage(summary ? `Imported — ${summary}` : 'Import completed (no rows matched).')
        }
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-white">Import Site Data</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Upload a JSON backup exported from this page. Tables are upserted by ID/key.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        aria-label="Import JSON backup"
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Importing…' : 'Import JSON'}
      </button>
      {message && <p className="text-xs text-green-400">{message}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}