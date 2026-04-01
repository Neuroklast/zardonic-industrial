/**
 * MembersManager — edit all 8 shell member slots.
 */

import { useState, useEffect } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { ImageUploader } from '../components/ImageUploader'
import { useMembers, useUpdateMember } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  role: string
  slotIndex: number
  imageUrl?: string
  bio?: string
  isActive: boolean
}

export function MembersManager() {
  const { data, isLoading } = useMembers()
  const updateMember = useUpdateMember()
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState<Omit<Member, 'id'>>({ name: '', role: 'entity', slotIndex: 0, isActive: false })

  const members = (data ?? []) as Member[]

  // Build 8-slot grid including empty slots
  const slots: (Member | null)[] = Array.from({ length: 8 }, (_, i) => members.find(m => m.slotIndex === i) ?? null)

  useEffect(() => {
    if (editing !== null) {
      const member = slots[editing]
      if (member) {
        setForm({ name: member.name, role: member.role, slotIndex: member.slotIndex, imageUrl: member.imageUrl, bio: member.bio, isActive: member.isActive })
      } else {
        setForm({ name: '', role: editing === 7 ? 'engineer' : 'entity', slotIndex: editing, isActive: false })
      }
    }
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (editing === null) return
    try {
      await updateMember.mutateAsync({ slotIndex: editing, ...form } as Record<string, unknown> & { slotIndex: number })
      toast.success('Gespeichert')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  if (isLoading) return <div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar title="Shell Members" breadcrumbs={['CMS', 'Members']} />
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {slots.map((member, i) => (
            <button
              key={i}
              onClick={() => setEditing(i)}
              className={`p-4 border text-left hover:border-red-600 transition-colors ${
                editing === i ? 'border-red-600' : 'border-zinc-700'
              }`}
            >
              {member?.imageUrl && (
                <img src={member.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover mb-2 border border-zinc-700" />
              )}
              <div className="text-xs font-mono text-zinc-300">{member?.name || `Slot ${i + 1}`}</div>
              <div className="text-xs font-mono text-zinc-600">{i === 7 ? 'Engineer' : `Entity ${i + 1}`}</div>
              {member && (
                <div className={`mt-1 text-xs font-mono ${member.isActive ? 'text-green-500' : 'text-zinc-600'}`}>
                  {member.isActive ? '● ACTIVE' : '○ INACTIVE'}
                </div>
              )}
            </button>
          ))}
        </div>

        {editing !== null && (
          <div className="border border-zinc-700 p-6 max-w-xl space-y-4">
            <h3 className="text-xs font-mono text-zinc-500 uppercase">
              // {editing === 7 ? 'Engineer' : `Entity ${editing + 1}`} — Slot {editing}
            </h3>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Bio</label>
              <textarea value={form.bio ?? ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                className="w-full bg-[#111] border border-zinc-700 text-zinc-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-red-600 resize-y" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2">Foto</label>
              <ImageUploader folder="members" onUploaded={url => setForm(p => ({ ...p, imageUrl: url }))} />
              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.imageUrl} alt="" className="w-10 h-10 object-cover border border-zinc-700" />
                  <button onClick={() => setForm(p => ({ ...p, imageUrl: undefined }))} className="text-xs text-zinc-500 hover:text-red-400">Entfernen</button>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-mono text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-red-500" />
              Active
            </label>
            <div className="flex gap-3">
              <button onClick={() => { void handleSave() }} disabled={updateMember.isPending}
                className="px-4 py-1.5 bg-red-600 text-white font-mono text-xs hover:bg-red-700 disabled:opacity-50">
                SPEICHERN
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-1.5 border border-zinc-600 text-zinc-400 font-mono text-xs hover:border-zinc-400">
                ABBRECHEN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
