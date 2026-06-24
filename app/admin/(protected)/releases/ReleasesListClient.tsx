'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowsMerge, MagnifyingGlass, X } from '@phosphor-icons/react'
import { mergeSelectedReleases } from '@/app/admin/_actions/releases'
import { DeleteReleaseButton } from './DeleteReleaseButton'
import { ReleaseVisibilityToggle } from './ReleaseVisibilityToggle'

export interface AdminReleaseRow {
  id: string
  title: string
  type: string
  release_date: string | null
  active: boolean
  display_order: number
}

type TypeFilter = 'all' | 'album' | 'ep' | 'single' | 'remix' | 'compilation'
type StatusFilter = 'all' | 'active' | 'hidden'
type SortKey = 'display_order' | 'title_asc' | 'title_desc' | 'date_desc' | 'date_asc' | 'type'

const TYPE_FILTERS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
  { value: 'remix', label: 'Remix' },
  { value: 'compilation', label: 'Compilation' },
]

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'display_order', label: 'Display order' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'type', label: 'Type' },
]

function compareReleases(a: AdminReleaseRow, b: AdminReleaseRow, sort: SortKey): number {
  switch (sort) {
    case 'title_asc':
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    case 'title_desc':
      return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
    case 'date_desc': {
      const da = a.release_date ?? ''
      const db = b.release_date ?? ''
      return db.localeCompare(da)
    }
    case 'date_asc': {
      const da = a.release_date ?? ''
      const db = b.release_date ?? ''
      return da.localeCompare(db)
    }
    case 'type':
      return a.type.localeCompare(b.type) || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    case 'display_order':
    default:
      return a.display_order - b.display_order || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  }
}

interface ReleasesListClientProps {
  releases: AdminReleaseRow[]
}

export function ReleasesListClient({ releases }: ReleasesListClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('display_order')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [mergeMessage, setMergeMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [isMerging, startMerge] = useTransition()

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matches = releases.filter((release) => {
      if (typeFilter !== 'all' && release.type !== typeFilter) return false
      if (statusFilter === 'active' && !release.active) return false
      if (statusFilter === 'hidden' && release.active) return false
      if (!query) return true
      return (
        release.title.toLowerCase().includes(query) ||
        release.type.toLowerCase().includes(query) ||
        (release.release_date ?? '').includes(query)
      )
    })

    return [...matches].sort((a, b) => compareReleases(a, b, sortKey))
  }, [releases, searchQuery, typeFilter, statusFilter, sortKey])

  const selectedCount = selectedIds.size
  const visibleIds = useMemo(() => new Set(filtered.map((release) => release.id)), [filtered])
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((release) => selectedIds.has(release.id))

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setMergeMessage(null)
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id)
      } else {
        for (const id of visibleIds) next.add(id)
      }
      return next
    })
    setMergeMessage(null)
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setMergeMessage(null)
  }

  function handleMergeSelected() {
    const ids = [...selectedIds]
    if (ids.length < 2) return

    const titles = releases
      .filter((release) => selectedIds.has(release.id))
      .map((release) => `• ${release.title}`)
      .join('\n')

    const confirmed = confirm(
      `Merge ${ids.length} releases into one entry?\n\nOnly succeeds when titles, dates, and platform data indicate the same release.\n\n${titles}`,
    )
    if (!confirmed) return

    startMerge(async () => {
      setMergeMessage(null)
      const result = await mergeSelectedReleases(ids)
      if ('error' in result) {
        setMergeMessage({ tone: 'error', text: result.error })
        return
      }

      const label = result.canonicalTitle ?? 'release'
      setMergeMessage({
        tone: 'success',
        text: `Merged into “${label}”. Removed ${result.deleted} duplicate(s).`,
      })
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  if (releases.length === 0) {
    return <p className="text-zinc-400 text-sm">No releases yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="admin-releases-search" className="sr-only">
            Search discography
          </label>
          <MagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            id="admin-releases-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Quick search title, type, date…"
            autoComplete="off"
            className="w-full min-h-[40px] rounded border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-10 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 inline-flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="admin-releases-sort" className="text-xs text-zinc-500 uppercase tracking-widest">
            Sort
          </label>
          <select
            id="admin-releases-sort"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="min-h-[40px] rounded border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setTypeFilter(filter.value)}
            className={`min-h-[36px] rounded border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              typeFilter === filter.value
                ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`min-h-[36px] rounded border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              statusFilter === filter.value
                ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-zinc-500 font-mono">
          {filtered.length} of {releases.length} release{releases.length === 1 ? '' : 's'}
          {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
        </p>
        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear selection
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleMergeSelected}
          disabled={selectedCount < 2 || isMerging}
          className="inline-flex min-h-[36px] items-center gap-2 rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs uppercase tracking-wider text-zinc-100 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowsMerge className="h-4 w-4" aria-hidden />
          {isMerging ? 'Merging…' : `Merge selected (${selectedCount})`}
        </button>
      </div>

      {mergeMessage ? (
        <p
          className={`text-sm ${mergeMessage.tone === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
          role="status"
        >
          {mergeMessage.text}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-zinc-400 text-sm">No releases match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="w-10 py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible releases"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-zinc-400"
                  />
                </th>
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((release) => {
                const isSelected = selectedIds.has(release.id)
                return (
                  <tr
                    key={release.id}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-900/50 ${isSelected ? 'bg-zinc-900/70' : ''}`}
                  >
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(release.id)}
                        aria-label={`Select ${release.title}`}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-zinc-400"
                      />
                    </td>
                    <td className="py-2 pr-4 text-zinc-200">{release.title}</td>
                    <td className="py-2 pr-4 text-zinc-400">{release.type}</td>
                    <td className="py-2 pr-4 text-zinc-400">{release.release_date ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <ReleaseVisibilityToggle releaseId={release.id} active={release.active ?? true} />
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <Link
                        href={`/admin/releases/${release.id}`}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteReleaseButton releaseId={release.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}