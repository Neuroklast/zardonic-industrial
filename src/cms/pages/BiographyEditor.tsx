/**
 * BiographyEditor — edit the artist biography with Tiptap.
 */

import { useState, useEffect } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { ContentEditor } from '../components/ContentEditor'
import { useAutoSave } from '../hooks/useAutoSave'
import { useBiography, useUpdateBiography } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface BioForm {
  content: string
  shortBio: string
  pressKitUrl: string
  isDraft: boolean
}

const defaults: BioForm = { content: '', shortBio: '', pressKitUrl: '', isDraft: true }

export function BiographyEditor() {
  const { data, isLoading } = useBiography()
  const updateBio = useUpdateBiography()
  const [form, setForm] = useState<BioForm>(defaults)

  const bioData = data as BioForm | undefined

  useEffect(() => {
    if (bioData) {
      setForm({
        content: bioData.content ?? '',
        shortBio: bioData.shortBio ?? '',
        pressKitUrl: bioData.pressKitUrl ?? '',
        isDraft: bioData.isDraft ?? true,
      })
    }
  }, [bioData])

  async function save(d: BioForm) {
    await updateBio.mutateAsync(d as Record<string, unknown>)
  }

  const { status } = useAutoSave({ key: 'biography', data: form, onSave: save })

  if (isLoading) return <div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title="Biography"
        breadcrumbs={['CMS', 'Biography']}
        actions={
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={status} />
            <DraftPublishToggle entity="biography" id="main" isDraft={form.isDraft} />
            <button
              onClick={async () => {
                try { await save(form); toast.success('Biographie gespeichert') }
                catch (err) { toast.error(err instanceof Error ? err.message : 'Fehler') }
              }}
              disabled={updateBio.isPending}
              className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700 disabled:opacity-50"
            >
              SPEICHERN
            </button>
          </div>
        }
      />
      <div className="p-6 max-w-4xl space-y-6">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Short Bio</label>
          <textarea
            value={form.shortBio}
            onChange={e => setForm(p => ({ ...p, shortBio: e.target.value }))}
            rows={3}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Press Kit URL</label>
          <input
            type="url"
            value={form.pressKitUrl}
            onChange={e => setForm(p => ({ ...p, pressKitUrl: e.target.value }))}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2">Biographie (Rich Text)</label>
          <ContentEditor
            content={form.content}
            onChange={v => setForm(p => ({ ...p, content: v }))}
            placeholder="Biographie eingeben…"
          />
        </div>
      </div>
    </div>
  )
}
