'use client'

import { useRouter } from 'next/navigation'
import { updateRelease } from '@/app/admin/_actions/releases'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { ReleaseExternalIdsSection } from '@/app/admin/_components/ReleaseExternalIdsSection'
import { StreamingLinksEditor } from '@/app/admin/_components/StreamingLinksEditor'
import { ReleaseTracklistField } from '@/app/admin/_components/ReleaseTracklistField'
import { useState } from 'react'

interface Props {
  release: Record<string, unknown>
  /** Pre-resolved cover URL (R2 preferred over raw CDN). Computed server-side. */
  resolvedCoverUrl?: string | null
}

export default function EditReleaseForm({ release, resolvedCoverUrl }: Props) {
  const router = useRouter()
  const [coverPath, setCoverPath] = useState((release.cover_storage_path as string) ?? '')
  const [coverPreview, setCoverPreview] = useState<string | null>(resolvedCoverUrl ?? null)
  const [streamingLinksJson, setStreamingLinksJson] = useState(
    release.streaming_links ? JSON.stringify(release.streaming_links) : '[]',
  )
  const [error, setError] = useState<string | null>(null)

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

      <ReleaseExternalIdsSection
        releaseId={release.id as string}
        initialItunesId={(release.itunes_id as string) ?? ''}
        initialSpotifyId={(release.spotify_id as string) ?? ''}
        initialDiscogsId={(release.discogs_id as string) ?? ''}
        onError={(msg) => setError(msg || null)}
        onSynced={({ coverUrl, coverStoragePath, metadata }) => {
          if (coverStoragePath) setCoverPath(coverStoragePath)
          if (coverUrl) setCoverPreview(coverUrl)
          setStreamingLinksJson(JSON.stringify(metadata.streaming_links))
          router.refresh()
        }}
      />

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
      </div>
      <ReleaseTracklistField initialTracks={release.tracks} />

      <div>
        <label className="block text-sm text-zinc-300 mb-2">Streaming Links</label>
        <StreamingLinksEditor key={streamingLinksJson} initialJson={streamingLinksJson} />
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