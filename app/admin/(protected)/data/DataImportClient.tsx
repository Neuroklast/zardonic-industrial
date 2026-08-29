'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload } from '@phosphor-icons/react'
import { finalizeSiteDataImport, importSiteBackupSection } from '@/app/admin/_actions/dataImport'
import {
  chunkRowsByJsonBytes,
  listPresentBackupSections,
  parseSiteBackupPayload,
  pickSectionRows,
} from '@/lib/site-data-backup'

export function DataImportClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(
      'Import will upsert data from this JSON file into Supabase (by id/key). Existing rows not in the file are not deleted. Continue?',
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    setMessage(null)
    setError(null)

    const reader = new FileReader()
    reader.onerror = () => {
      setError('Could not read the file')
    }
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      startTransition(async () => {
        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          setError('Invalid JSON file')
          return
        }

        const backup = parseSiteBackupPayload(parsed)
        if (!backup.ok) {
          setError(backup.error)
          return
        }

        const totals: Record<string, number> = {}
        const sections = listPresentBackupSections(backup.data)
        if (sections.length === 0) {
          setError('Backup file contains no recognised site data tables')
          return
        }

        for (const section of sections) {
          const rows = pickSectionRows(backup.data, section)
          const chunks = chunkRowsByJsonBytes(rows)
          if (chunks.length === 0) continue

          for (const chunk of chunks) {
            const result = await importSiteBackupSection(section.exportKey, chunk)
            if (!result.ok) {
              setError(result.error ?? `Import failed for ${section.table}`)
              return
            }
            for (const [table, count] of Object.entries(result.imported ?? {})) {
              totals[table] = (totals[table] ?? 0) + count
            }
          }
        }

        const finished = await finalizeSiteDataImport()
        if (!finished.ok) {
          setError(finished.error ?? 'Import wrote rows but cache revalidation failed')
          return
        }

        const summary = Object.entries(totals)
          .map(([table, count]) => `${table}: ${count}`)
          .join(', ')
        setMessage(summary ? `Imported — ${summary}` : 'Import completed (no rows matched).')
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
          Upload a JSON backup exported from this page. Tables are upserted by ID/key, including
          manually edited releases and news posts. Does not delete extra rows already in the database.
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
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50 min-h-[44px]"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Importing…' : 'Import JSON'}
      </button>
      {message && <p className="text-xs text-green-400">{message}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
