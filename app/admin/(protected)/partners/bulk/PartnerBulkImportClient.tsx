'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPartnersBatch } from '@/app/admin/_actions/partners'
import { cacheRemoteImageToR2 } from '@/app/admin/_actions/cacheRemoteImage'
import { submitOptimizedUpload } from '@/app/admin/_lib/submitOptimizedUpload'
import { formatImageUploadError } from '@/lib/image-crop-export'
import {
  PARTNER_BULK_INSERT_CHUNK,
  PARTNER_BULK_MAX_ROWS,
  PARTNER_BULK_UPLOAD_CONCURRENCY,
  PARTNER_CATEGORIES,
  chunkPartnerRows,
  markDuplicateRows,
  nameFromFileName,
  parsePartnerListText,
  toPartnerBulkPayload,
  type PartnerBulkPayload,
  type PartnerCategory,
  type PartnerListRowError,
} from '@/lib/partner-bulk-import'

interface ExistingPartner {
  name: string
  category: string
}

interface PartnerBulkImportClientProps {
  existing: ExistingPartner[]
}

type DraftStatus = 'idle' | 'uploading' | 'ready' | 'error'
type Mode = 'files' | 'list'

interface DraftRow {
  id: string
  name: string
  url: string
  category: PartnerCategory
  displayOrder: number
  logoWhite: boolean
  logoStoragePath: string
  logoUrl: string
  fileName: string | null
  previewUrl: string | null
  file: File | null
  status: DraftStatus
  error: string | null
}

interface ImportSummary {
  inserted: number
  skipped: number
  failed: number
}

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  credit: 'Credit',
  endorsement: 'Endorsement',
  partner: 'Partner / Friend',
  label: 'Label',
  sponsor: 'Sponsor',
}

const LIST_PLACEHOLDER = [
  'Name | Website URL | Logo URL (optional) | Section (optional) | Order (optional)',
  'Ableton | https://ableton.com | https://cdn.example/ableton.png | credit | 1',
  'Native Instruments | https://native-instruments.com',
].join('\n')

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await worker(current)
    }
  })
  await Promise.all(runners)
}

export function PartnerBulkImportClient({ existing }: PartnerBulkImportClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  const [mode, setMode] = useState<Mode>('files')
  const [rows, setRows] = useState<DraftRow[]>([])
  const [listText, setListText] = useState('')
  const [parseErrors, setParseErrors] = useState<PartnerListRowError[]>([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ phase: string; done: number; total: number } | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  function nextId(): string {
    idRef.current += 1
    return `row-${idRef.current}`
  }

  const duplicateFlags = useMemo(
    () => markDuplicateRows(rows.map((row) => ({ name: row.name, category: row.category })), existing),
    [rows, existing],
  )

  const importableIndexes = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => !duplicateFlags[index] && row.name.trim() !== '')

  const duplicateCount = duplicateFlags.filter(Boolean).length

  function updateRow(id: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (incoming.length === 0) return

    const remaining = PARTNER_BULK_MAX_ROWS - rows.length
    if (remaining <= 0) {
      setError(`Row limit reached (${PARTNER_BULK_MAX_ROWS}).`)
      return
    }

    const accepted = incoming.slice(0, remaining)
    if (accepted.length < incoming.length) {
      setError(`Row limit is ${PARTNER_BULK_MAX_ROWS} — ${incoming.length - accepted.length} file(s) ignored.`)
    } else {
      setError(null)
    }

    const base = rows.length
    const next: DraftRow[] = accepted.map((file, index) => ({
      id: nextId(),
      name: nameFromFileName(file.name),
      url: '',
      category: 'partner',
      displayOrder: base + index,
      logoWhite: true,
      logoStoragePath: '',
      logoUrl: '',
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
      status: 'idle',
      error: null,
    }))
    setRows((prev) => [...prev, ...next])
    setSummary(null)
  }

  function addEmptyRow() {
    if (rows.length >= PARTNER_BULK_MAX_ROWS) {
      setError(`Row limit reached (${PARTNER_BULK_MAX_ROWS}).`)
      return
    }
    setRows((prev) => [
      ...prev,
      {
        id: nextId(),
        name: '',
        url: '',
        category: 'partner',
        displayOrder: prev.length,
        logoWhite: true,
        logoStoragePath: '',
        logoUrl: '',
        fileName: null,
        previewUrl: null,
        file: null,
        status: 'idle',
        error: null,
      },
    ])
    setSummary(null)
  }

  function removeRow(id: string) {
    const target = rows.find((row) => row.id === id)
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  function clearAll() {
    for (const row of rows) {
      if (row.previewUrl) URL.revokeObjectURL(row.previewUrl)
    }
    setRows([])
    setParseErrors([])
    setSummary(null)
    setError(null)
    setProgress(null)
  }

  function applyCategoryToAll(category: PartnerCategory) {
    setRows((prev) => prev.map((row) => ({ ...row, category })))
  }

  function handleParseList() {
    const result = parsePartnerListText(listText)
    setParseErrors(result.errors)

    if (result.rows.length === 0) {
      setError('No rows found in the pasted list.')
      return
    }

    const remaining = PARTNER_BULK_MAX_ROWS - rows.length
    if (remaining <= 0) {
      setError(`Row limit reached (${PARTNER_BULK_MAX_ROWS}).`)
      return
    }

    const accepted = result.rows.slice(0, remaining)
    const base = rows.length
    const next: DraftRow[] = accepted.map((row, index) => ({
      id: nextId(),
      name: row.name,
      url: row.url ?? '',
      category: row.category,
      displayOrder: row.displayOrder || base + index,
      logoWhite: row.logoWhite,
      logoStoragePath: '',
      logoUrl: row.logoUrl ?? '',
      fileName: null,
      previewUrl: null,
      file: null,
      status: 'idle',
      error: null,
    }))
    setRows((prev) => [...prev, ...next])
    setError(null)
    setSummary(null)
  }

  async function handleImport() {
    setError(null)
    setSummary(null)

    const targets = importableIndexes.map(({ row }) => row)
    if (targets.length === 0) {
      setError('Nothing to import — add rows or resolve duplicates first.')
      return
    }

    setBusy(true)
    setProgress({ phase: 'Uploading logos', done: 0, total: targets.length })

    const uploadResults = new Map<string, { storagePath: string | null; error: string | null }>()
    const mediaRows = targets.filter(
      (row) => (row.file && !row.logoStoragePath) || (row.logoUrl && !row.logoStoragePath),
    )

    let processed = 0
    await runWithConcurrency(mediaRows, PARTNER_BULK_UPLOAD_CONCURRENCY, async (row) => {
      updateRow(row.id, { status: 'uploading', error: null })
      try {
        if (row.file) {
          const { storagePath } = await submitOptimizedUpload(row.file, 'partners/logos', {
            maxWidth: 1200,
            maxHeight: 1200,
          })
          uploadResults.set(row.id, { storagePath, error: null })
          updateRow(row.id, { status: 'ready', logoStoragePath: storagePath })
        } else {
          const cached = await cacheRemoteImageToR2(row.logoUrl, { prefix: 'partners/logos' })
          if (cached.ok && cached.storagePath) {
            uploadResults.set(row.id, { storagePath: cached.storagePath, error: null })
            updateRow(row.id, { status: 'ready', logoStoragePath: cached.storagePath })
          } else {
            const message = cached.error ?? 'Logo could not be cached'
            uploadResults.set(row.id, { storagePath: null, error: message })
            updateRow(row.id, { status: 'error', error: `${message} — remote URL kept` })
          }
        }
      } catch (err) {
        const message = formatImageUploadError(err)
        uploadResults.set(row.id, { storagePath: null, error: message })
        updateRow(row.id, { status: 'error', error: message })
      } finally {
        processed += 1
        setProgress({ phase: 'Uploading logos', done: processed, total: targets.length })
      }
    })

    setProgress({ phase: 'Saving entries', done: targets.length, total: targets.length })

    const failedIds = new Set<string>()
    const payloads: PartnerBulkPayload[] = []
    for (const row of targets) {
      const uploaded = uploadResults.get(row.id)
      if (row.file && !uploaded?.storagePath) {
        failedIds.add(row.id)
        continue
      }
      const storagePath = uploaded?.storagePath ?? (row.logoStoragePath || null)
      payloads.push(
        toPartnerBulkPayload({
          name: row.name,
          url: row.url,
          category: row.category,
          displayOrder: row.displayOrder,
          logoWhite: row.logoWhite,
          logoStoragePath: storagePath,
          logoUrl: storagePath ? null : row.logoUrl || null,
        }),
      )
    }

    let inserted = 0
    let skipped = 0
    let importError: string | null = null

    for (const chunk of chunkPartnerRows(payloads, PARTNER_BULK_INSERT_CHUNK)) {
      const result = await createPartnersBatch(chunk)
      if (!result.ok) {
        importError = result.error ?? 'Import failed.'
        break
      }
      inserted += result.inserted
      skipped += result.skipped
    }

    setBusy(false)
    setProgress(null)

    if (importError) {
      setError(importError)
      setSummary({ inserted, skipped, failed: failedIds.size })
      return
    }

    const removeIds = new Set(targets.filter((row) => !failedIds.has(row.id)).map((row) => row.id))
    for (const row of rows) {
      if (removeIds.has(row.id) && row.previewUrl) URL.revokeObjectURL(row.previewUrl)
    }
    setRows((prev) => prev.filter((row) => !removeIds.has(row.id)))
    setSummary({ inserted, skipped, failed: failedIds.size })
    router.refresh()
  }

  const canImport = !busy && importableIndexes.length > 0

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap gap-2">
        {(['files', 'list'] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            disabled={busy}
            onClick={() => setMode(option)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors disabled:opacity-50 ${
              mode === option
                ? 'border-red-700/60 bg-red-900/30 text-white'
                : 'border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {option === 'files' ? 'Upload files' : 'Paste a list'}
          </button>
        ))}
      </div>

      {mode === 'files' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!busy) addFiles(e.dataTransfer.files)
          }}
          className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
            dragging ? 'border-red-600/60 bg-red-950/20' : 'border-zinc-700 bg-zinc-900/40'
          }`}
        >
          <p className="text-sm text-zinc-300">Drop logo files here, or</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors disabled:opacity-50"
          >
            Choose files
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Names are filled from the file name. Add website URL and section per row below.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <label className="block text-xs text-zinc-400" htmlFor="partner-list-input">
            One entry per line. Delimiter can be a tab, a pipe or a comma. Header row and # comments are ignored.
          </label>
          <textarea
            id="partner-list-input"
            value={listText}
            disabled={busy}
            onChange={(e) => setListText(e.target.value)}
            rows={8}
            placeholder={LIST_PLACEHOLDER}
            className="w-full font-mono text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-200"
          />
          <button
            type="button"
            disabled={busy || listText.trim() === ''}
            onClick={handleParseList}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors disabled:opacity-50"
          >
            Add to table
          </button>
        </div>
      )}

      {parseErrors.length > 0 && (
        <ul className="text-xs text-amber-400 space-y-1">
          {parseErrors.map((item) => (
            <li key={`${item.line}-${item.message}`}>Line {item.line}: {item.message}</li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-zinc-300">
              {rows.length} row{rows.length === 1 ? '' : 's'}
              {duplicateCount > 0 && <span className="text-amber-400"> · {duplicateCount} duplicate skipped</span>}
            </span>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              Set section for all
              <select
                disabled={busy}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applyCategoryToAll(e.target.value as PartnerCategory)
                  e.target.value = ''
                }}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs"
              >
                <option value="">—</option>
                {PARTNER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={addEmptyRow}
              className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              + Row without file
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={clearAll}
              className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900">
                <tr className="text-zinc-400 text-left">
                  <th className="py-2 px-2 font-medium">Logo</th>
                  <th className="py-2 px-2 font-medium">Name</th>
                  <th className="py-2 px-2 font-medium">Website URL</th>
                  <th className="py-2 px-2 font-medium">Section</th>
                  <th className="py-2 px-2 font-medium">Order</th>
                  <th className="py-2 px-2 font-medium">White</th>
                  <th className="py-2 px-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isDuplicate = duplicateFlags[index]
                  const preview = row.previewUrl ?? (row.logoUrl || null)
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-zinc-800/60 ${isDuplicate ? 'bg-amber-950/20' : ''}`}
                    >
                      <td className="py-2 px-2">
                        <div className="w-10 h-10 rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
                          {preview ? (
                            <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          value={row.name}
                          disabled={busy}
                          onChange={(e) => updateRow(row.id, { name: e.target.value })}
                          aria-label="Name"
                          className="w-40 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                        {isDuplicate && <p className="text-amber-400 text-xs mt-1">Already exists — skipped</p>}
                        {row.error && <p className="text-red-400 text-xs mt-1">{row.error}</p>}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          value={row.url}
                          disabled={busy}
                          onChange={(e) => updateRow(row.id, { url: e.target.value })}
                          placeholder="https://…"
                          aria-label="Website URL"
                          className="w-48 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.category}
                          disabled={busy}
                          onChange={(e) => updateRow(row.id, { category: e.target.value as PartnerCategory })}
                          aria-label="Section"
                          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        >
                          {PARTNER_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={row.displayOrder}
                          disabled={busy}
                          onChange={(e) => updateRow(row.id, { displayOrder: Number(e.target.value) || 0 })}
                          aria-label="Display order"
                          className="w-16 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={row.logoWhite}
                          disabled={busy}
                          onChange={(e) => updateRow(row.id, { logoWhite: e.target.checked })}
                          aria-label="White logo fill"
                          className="rounded border-zinc-600"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeRow(row.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canImport}
              onClick={() => void handleImport()}
              className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors disabled:opacity-50"
            >
              {busy ? 'Importing…' : `Import ${importableIndexes.length} entr${importableIndexes.length === 1 ? 'y' : 'ies'}`}
            </button>
            {progress && (
              <span className="text-xs text-zinc-400">
                {progress.phase} {progress.done}/{progress.total}
              </span>
            )}
          </div>
        </div>
      )}

      {summary && (
        <p className="text-sm text-green-400">
          Imported {summary.inserted}, skipped {summary.skipped} duplicate
          {summary.skipped === 1 ? '' : 's'}
          {summary.failed > 0 && <span className="text-amber-400"> · {summary.failed} failed</span>}
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
