/**
 * VideoEditor — create/edit a single video.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useAutoSave } from '../hooks/useAutoSave'
import { useCreateVideo, useUpdateVideo } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface VideoForm {
  title: string
  youtubeId: string
  description: string
  category: string
  featured: boolean
  isDraft: boolean
}

const defaults: VideoForm = {
  title: '', youtubeId: '', description: '', category: '', featured: false, isDraft: true,
}

/** Extracts YouTube video ID from various URL formats */
function extractYoutubeId(input: string): string {
  const match = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? input
}

export function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState<VideoForm>(defaults)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id ?? null))

  const create = useCreateVideo()
  const update = useUpdateVideo()

  async function save(data: VideoForm) {
    const payload = { ...data, youtubeId: extractYoutubeId(data.youtubeId) || null, category: data.category || null }
    if (isNew && !savedId) {
      const result = await create.mutateAsync(payload as Record<string, unknown>) as { id: string }
      setSavedId(result.id)
    } else {
      await update.mutateAsync({ id: savedId ?? id ?? '', ...payload } as Record<string, unknown> & { id: string })
    }
  }

  const { status } = useAutoSave({ key: `video-${id}`, data: form, onSave: save, enabled: form.title.length > 0 })

  function f<K extends keyof VideoForm>(key: K, value: VideoForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title={isNew ? 'Neues Video' : 'Video bearbeiten'}
        breadcrumbs={['CMS', 'Videos']}
        actions={
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={status} />
            {savedId && <DraftPublishToggle entity="video" id={savedId} isDraft={form.isDraft} />}
            <button
              onClick={async () => {
                try { await save(form); toast.success('Video gespeichert'); if (isNew && savedId) void navigate(`/cms/videos/${savedId}`) }
                catch (err) { toast.error(err instanceof Error ? err.message : 'Fehler') }
              }}
              className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700"
            >
              SPEICHERN
            </button>
          </div>
        }
      />
      <div className="p-6 max-w-3xl space-y-4">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Titel *</label>
          <input type="text" value={form.title} onChange={e => f('title', e.target.value)}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">YouTube URL oder Video-ID</label>
          <input type="text" value={form.youtubeId} onChange={e => f('youtubeId', e.target.value)}
            placeholder="https://youtube.com/watch?v=... oder dQw4w9WgXcQ"
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Kategorie</label>
          <select value={form.category} onChange={e => f('category', e.target.value)}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600">
            <option value="">— Keine —</option>
            <option value="music_video">Music Video</option>
            <option value="live">Live</option>
            <option value="behind_scenes">Behind the Scenes</option>
            <option value="remix">Remix</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Beschreibung</label>
          <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y" />
        </div>
        <label className="flex items-center gap-2 text-sm font-mono text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} className="accent-red-500" />
          Featured
        </label>
      </div>
    </div>
  )
}
