/**
 * ReleaseEditor — create/edit a single release with auto-save.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { ImageUploader } from '../components/ImageUploader'
import { useAutoSave } from '../hooks/useAutoSave'
import { useCreateRelease, useUpdateRelease } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface ReleaseForm {
  title: string
  type: string
  releaseDate: string
  coverUrl: string
  description: string
  spotifyUrl: string
  appleMusicUrl: string
  bandcampUrl: string
  youtubeUrl: string
  soundcloudUrl: string
  isDraft: boolean
}

const defaults: ReleaseForm = {
  title: '', type: 'single', releaseDate: '', coverUrl: '',
  description: '', spotifyUrl: '', appleMusicUrl: '', bandcampUrl: '',
  youtubeUrl: '', soundcloudUrl: '', isDraft: true,
}

export function ReleaseEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState<ReleaseForm>(defaults)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id ?? null))

  const create = useCreateRelease()
  const update = useUpdateRelease()

  async function save(data: ReleaseForm) {
    if (isNew && !savedId) {
      const result = await create.mutateAsync(data as Record<string, unknown>) as { id: string }
      setSavedId(result.id)
    } else {
      await update.mutateAsync({ id: savedId ?? id ?? '', ...data } as Record<string, unknown> & { id: string })
    }
  }

  const { status } = useAutoSave({ key: `release-${id}`, data: form, onSave: save, enabled: form.title.length > 0 })

  function f<K extends keyof ReleaseForm>(key: K, value: ReleaseForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    try {
      await save(form)
      toast.success('Release gespeichert')
      if (isNew && savedId) void navigate(`/cms/releases/${savedId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  const title = isNew ? 'Neuer Release' : 'Release bearbeiten'

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title={title}
        breadcrumbs={['CMS', 'Releases', title]}
        actions={
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={status} />
            {savedId && <DraftPublishToggle entity="release" id={savedId} isDraft={form.isDraft} />}
            <button onClick={() => { void handleSave() }} className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700">
              SPEICHERN
            </button>
          </div>
        }
      />
      <div className="p-6 max-w-3xl space-y-6">
        <Field label="Titel *" value={form.title} onChange={v => f('title', v)} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Typ</label>
            <select
              value={form.type}
              onChange={e => f('type', e.target.value)}
              className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600"
            >
              {['album', 'ep', 'single', 'remix'].map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <Field label="Release Date" value={form.releaseDate} onChange={v => f('releaseDate', v)} type="date" />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2">Cover</label>
          {form.coverUrl ? (
            <div className="flex items-center gap-4">
              <img src={form.coverUrl} alt="" className="w-24 h-24 object-cover border border-zinc-700" />
              <div className="flex-1">
                <input
                  type="url"
                  value={form.coverUrl}
                  onChange={e => f('coverUrl', e.target.value)}
                  className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600"
                />
                <button onClick={() => f('coverUrl', '')} className="mt-1 text-xs text-zinc-500 hover:text-red-400">
                  Entfernen
                </button>
              </div>
            </div>
          ) : (
            <ImageUploader folder="covers" onUploaded={url => f('coverUrl', url)} />
          )}
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Beschreibung</label>
          <textarea
            value={form.description}
            onChange={e => f('description', e.target.value)}
            rows={4}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y"
          />
        </div>

        <section>
          <h3 className="text-xs font-mono text-zinc-500 uppercase mb-3">// Streaming Links</h3>
          <div className="space-y-3">
            <Field label="Spotify URL" value={form.spotifyUrl} onChange={v => f('spotifyUrl', v)} type="url" />
            <Field label="Apple Music URL" value={form.appleMusicUrl} onChange={v => f('appleMusicUrl', v)} type="url" />
            <Field label="Bandcamp URL" value={form.bandcampUrl} onChange={v => f('bandcampUrl', v)} type="url" />
            <Field label="YouTube URL" value={form.youtubeUrl} onChange={v => f('youtubeUrl', v)} type="url" />
            <Field label="SoundCloud URL" value={form.soundcloudUrl} onChange={v => f('soundcloudUrl', v)} type="url" />
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600"
      />
    </div>
  )
}
