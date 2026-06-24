'use client'

import { Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { parseReleaseTracks } from '@/lib/release-public-mapper'

export interface TracklistRow {
  title: string
  artist: string
  duration: string
  featuredArtists: string
}

interface ReleaseTracklistFieldProps {
  initialTracks: unknown
}

function toRows(value: unknown): TracklistRow[] {
  const parsed = parseReleaseTracks(value)
  if (parsed.length === 0) {
    return [{ title: '', artist: '', duration: '', featuredArtists: '' }]
  }

  return parsed.map((track) => ({
    title: track.title,
    artist: track.artist ?? '',
    duration: track.duration ?? '',
    featuredArtists: track.featuredArtists?.join(', ') ?? '',
  }))
}

function rowsToPayload(rows: TracklistRow[]) {
  return rows
    .filter((row) => row.title.trim())
    .map((row) => {
      const track: Record<string, unknown> = { title: row.title.trim() }
      if (row.artist.trim()) track.artist = row.artist.trim()
      if (row.duration.trim()) track.duration = row.duration.trim()
      const featured = row.featuredArtists
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
      if (featured.length > 0) track.featuredArtists = featured
      return track
    })
}

export function ReleaseTracklistField({ initialTracks }: ReleaseTracklistFieldProps) {
  const [rows, setRows] = useState<TracklistRow[]>(() => toRows(initialTracks))

  function updateRow(index: number, field: keyof TracklistRow, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, { title: '', artist: '', duration: '', featuredArtists: '' }])
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const payload = rowsToPayload(rows)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm text-zinc-300">Tracklist</label>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add track
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-3 sm:grid-cols-[1fr_1fr_5rem_1fr_auto]"
          >
            <div className="sm:col-span-1">
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                Title *
              </label>
              <input
                value={row.title}
                onChange={(e) => updateRow(index, 'title', e.target.value)}
                placeholder="Track name"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                aria-label={`Track ${index + 1} title`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                Artist
              </label>
              <input
                value={row.artist}
                onChange={(e) => updateRow(index, 'artist', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                aria-label={`Track ${index + 1} artist`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                Duration
              </label>
              <input
                value={row.duration}
                onChange={(e) => updateRow(index, 'duration', e.target.value)}
                placeholder="3:42"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                aria-label={`Track ${index + 1} duration`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                Featured
              </label>
              <input
                value={row.featuredArtists}
                onChange={(e) => updateRow(index, 'featuredArtists', e.target.value)}
                placeholder="Guest A, Guest B"
                className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500"
                aria-label={`Track ${index + 1} featured artists`}
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 1}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-zinc-800 text-zinc-500 hover:border-red-800 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Remove track ${index + 1}`}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Shown in the public release modal. Empty rows are ignored on save.
      </p>

      <input type="hidden" name="tracks" value={JSON.stringify(payload)} readOnly />
    </div>
  )
}