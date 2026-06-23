'use client'

import { useRouter } from 'next/navigation'
import { createRelease } from '@/app/admin/_actions/releases'
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import { ReleaseExternalIdsSection } from '@/app/admin/_components/ReleaseExternalIdsSection'
import { StreamingLinksEditor } from '@/app/admin/_components/StreamingLinksEditor'
import type { ReleaseMetadata } from '@/lib/release-metadata'
import { useState } from 'react'

export default function NewReleasePage() {
  const router = useRouter()
  const [coverPath, setCoverPath] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('single')
  const [releaseDate, setReleaseDate] = useState('')
  const [description, setDescription] = useState('')
  const [artists, setArtists] = useState('')
  const [streamingLinksJson, setStreamingLinksJson] = useState('[]')
  const [error, setError] = useState<string | null>(null)

  function applyMetadata(metadata: ReleaseMetadata) {
    setTitle(metadata.title)
    if (metadata.type) setType(metadata.type)
    if (metadata.release_date) setReleaseDate(metadata.release_date)
    if (metadata.description) setDescription(metadata.description)
    if (metadata.artists.length) setArtists(metadata.artists.join(', '))
    setStreamingLinksJson(JSON.stringify(metadata.streaming_links))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (coverPath) {
      formData.set('cover_storage_path', coverPath)
      formData.set('cover_url', '')
    }

    const result = await createRelease(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      router.push('/admin/releases')
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">New Release</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title *</label>
          <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Type</label>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none">
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
            <option value="remix">Remix</option>
            <option value="compilation">Compilation</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Release Date</label>
          <input name="release_date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Description</label>
          <textarea name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Artists (comma separated)</label>
          <input name="artists" value={artists} onChange={(e) => setArtists(e.target.value)} className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none" placeholder="Zardonic, Guest Artist" />
        </div>

        <ReleaseExternalIdsSection onError={(msg) => setError(msg || null)} onPreview={applyMetadata} />

        <MediaSourcePicker
          label="Cover Art"
          storagePrefix="releases/covers"
          onResolved={(path) => {
            setCoverPath(path)
            setError(null)
          }}
          onError={(msg) => setError(msg)}
        />
        <div>
          <label className="block text-sm text-zinc-300 mb-2">Streaming Links</label>
          <StreamingLinksEditor key={streamingLinksJson} initialJson={streamingLinksJson} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-colors">
            Create Release
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}