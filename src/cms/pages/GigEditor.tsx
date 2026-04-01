/**
 * GigEditor — create/edit a single gig.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CmsTopBar } from '../components/CmsTopBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { DraftPublishToggle } from '../components/DraftPublishToggle'
import { useAutoSave } from '../hooks/useAutoSave'
import { useCreateGig, useUpdateGig } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface GigForm {
  title: string
  venue: string
  city: string
  country: string
  date: string
  doorsOpen: string
  ticketUrl: string
  description: string
  isSoldOut: boolean
  isCancelled: boolean
  isDraft: boolean
}

const defaults: GigForm = {
  title: '', venue: '', city: '', country: '', date: '',
  doorsOpen: '', ticketUrl: '', description: '',
  isSoldOut: false, isCancelled: false, isDraft: true,
}

export function GigEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState<GigForm>(defaults)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id ?? null))

  const create = useCreateGig()
  const update = useUpdateGig()

  async function save(data: GigForm) {
    const payload = { ...data, date: data.date ? new Date(data.date).toISOString() : '' }
    if (isNew && !savedId) {
      const result = await create.mutateAsync(payload as Record<string, unknown>) as { id: string }
      setSavedId(result.id)
    } else {
      await update.mutateAsync({ id: savedId ?? id ?? '', ...payload } as Record<string, unknown> & { id: string })
    }
  }

  const { status } = useAutoSave({ key: `gig-${id}`, data: form, onSave: save, enabled: form.title.length > 0 })

  function f<K extends keyof GigForm>(key: K, value: GigForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar
        title={isNew ? 'Neuer Gig' : 'Gig bearbeiten'}
        breadcrumbs={['CMS', 'Gigs']}
        actions={
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={status} />
            {savedId && <DraftPublishToggle entity="gig" id={savedId} isDraft={form.isDraft} />}
            <button
              onClick={async () => {
                try { await save(form); toast.success('Gig gespeichert'); if (isNew && savedId) void navigate(`/cms/gigs/${savedId}`) }
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
        <Field label="Titel *" value={form.title} onChange={v => f('title', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Venue *" value={form.venue} onChange={v => f('venue', v)} />
          <Field label="City *" value={form.city} onChange={v => f('city', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Country *" value={form.country} onChange={v => f('country', v)} />
          <Field label="Date *" value={form.date} onChange={v => f('date', v)} type="datetime-local" />
        </div>
        <Field label="Doors Open" value={form.doorsOpen} onChange={v => f('doorsOpen', v)} />
        <Field label="Ticket URL" value={form.ticketUrl} onChange={v => f('ticketUrl', v)} type="url" />
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-1">Beschreibung</label>
          <textarea
            value={form.description}
            onChange={e => f('description', e.target.value)}
            rows={4}
            className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y"
          />
        </div>
        <div className="flex gap-6">
          <CheckField label="Sold Out" checked={form.isSoldOut} onChange={v => f('isSoldOut', v)} />
          <CheckField label="Cancelled" checked={form.isCancelled} onChange={v => f('isCancelled', v)} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
    </div>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-mono text-zinc-400 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-red-500" />
      {label}
    </label>
  )
}
