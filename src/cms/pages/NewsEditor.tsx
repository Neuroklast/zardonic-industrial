/**
 * NewsEditor — create/edit a news post with Tiptap rich text.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { ContentEditor } from '../components/ContentEditor'
import { useAutoSave } from '../hooks/useAutoSave'
import { useCreateNewsPost, useUpdateNewsPost } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface NewsForm {
  title: string
  slug: string
  content: string
  excerpt: string
  isDraft: boolean
}

const defaults: NewsForm = { title: '', slug: '', content: '', excerpt: '', isDraft: true }

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 100)
}

export function NewsEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState<NewsForm>(defaults)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id ?? null))

  const create = useCreateNewsPost()
  const update = useUpdateNewsPost()

  async function save(data: NewsForm) {
    if (isNew && !savedId) {
      const result = await create.mutateAsync(data as Record<string, unknown>) as { id: string }
      setSavedId(result.id)
    } else {
      await update.mutateAsync({ id: savedId ?? id ?? '', ...data } as Record<string, unknown> & { id: string })
    }
  }

  const { status } = useAutoSave({ key: `news-${id}`, data: form, onSave: save, enabled: form.title.length > 0 })

  function f<K extends keyof NewsForm>(key: K, value: NewsForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title={isNew ? 'Neuer Post' : 'Post bearbeiten'}
        breadcrumbs={['CMS', 'News']}
        actions={
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={status} />
            {savedId && <DraftPublishToggle entity="news" id={savedId} isDraft={form.isDraft} />}
            <button
              onClick={async () => {
                try { await save(form); toast.success('Post gespeichert'); if (isNew && savedId) void navigate(`/cms/news/${savedId}`) }
                catch (err) { toast.error(err instanceof Error ? err.message : 'Fehler') }
              }}
              className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700"
            >
              SPEICHERN
            </button>
          </div>
        }
      />
      <div className="p-6 max-w-4xl space-y-4">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Titel *</label>
          <input type="text" value={form.title}
            onChange={e => { f('title', e.target.value); if (isNew) f('slug', toSlug(e.target.value)) }}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Slug</label>
          <input type="text" value={form.slug} onChange={e => f('slug', e.target.value)}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => f('excerpt', e.target.value)} rows={2}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y" />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2">Inhalt</label>
          <ContentEditor content={form.content} onChange={v => f('content', v)} placeholder="Post-Inhalt…" />
        </div>
      </div>
    </div>
  )
}
