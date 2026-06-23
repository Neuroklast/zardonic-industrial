'use client'

import { useRouter } from 'next/navigation'
import { updateRelease } from '@/app/admin/_actions/releases'
import { fetchItunesCoverForRelease } from '@/app/admin/_actions/itunesSync'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { StreamingLinksEditor } from '@/app/admin/_components/StreamingLinksEditor'
import { useState } from 'react'

interface Props {
  release: Record<string, unknown>
  /** Pre-resolved cover URL (R2 preferred over raw iTunes CDN). Computed server-side. */
  resolvedCoverUrl?: string | null
}

export default function EditReleaseForm({ release, resolvedCoverUrl }: Props) {
  const router = useRouter()
  const [coverPath, setCoverPath] = useState((release.cover_storage_path as string) ?? '')
  const [coverPreview, setCoverPreview] = useState<string | null>(resolvedCoverUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [fetchingCover, setFetchingCover] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (coverPath) {
      formData.set('cover_storage_path', coverPath)
      formData.set('cover_url', '')
    }

    const result = await updateRelease(release.id as string, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      router.push('/admin/releases')
    }
  }

  const streamingLinksJson = release.streaming_links
    ? JSON.stringify(release.streaming_links)
    : '[]'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Title *</label>
        <input name="title" required defaultValue={release.title as string} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500" />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Type</label>
        <select name="type" defaultValue={release.type as string} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none">
          <option value="single">Single</option>
          <option value="ep">EP</option>
          <option value="album">Album</option>
          <option value="remix">Remix</option>
          <option value="compilation">Compilation</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Release Date</label>
        <input name="release_date" type="date" defaultValue={(release.release_date as string) ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Description</label>
        <textarea name="description" rows={3} defaultValue={(release.description as string) ?? ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none resize-none" />
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Artists (comma separated)</label>
        <input name="artists" defaultValue={Array.isArray(release.artists) ? (release.artists as string[]).join(', ') : ''} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
      </div>
      <div className="space-y-2">
        <MediaSourcePicker
          label="Cover Art"
          currentUrl={coverPreview}
          storagePrefix={`releases/covers/${release.id as string}`}
          onResolved={(path, publicUrl) => {
            setCoverPath(path)
            if (publicUrl) setCoverPreview(publicUrl)
            setError(null)
          }}
          onError={(msg) => setError(msg)}
        />
        <button
          type="button"
          disabled={fetchingCover}
          onClick={async () => {
            setFetchingCover(true)
            setError(null)
            const result = await fetchItunesCoverForRelease(release.id as string)
            if (!result.ok) {
              setError(result.error ?? 'Failed to fetch iTunes cover')
            } else if (result.coverUrl) {
              setCoverPath(result.coverStoragePath ?? '')
              setCoverPreview(result.coverUrl)
            }
            setFetchingCover(false)
          }}
          className="px-3 py-2 text-xs rounded border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-50"
        >
          {fetchingCover ? 'Fetching…' : 'Cover von iTunes'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-zinc-300 mb-2">Streaming Links</label>
        <StreamingLinksEditor initialJson={streamingLinksJson} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">
          Save Changes
        </button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}