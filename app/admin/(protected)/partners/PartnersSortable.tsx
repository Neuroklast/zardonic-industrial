'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { deletePartner, reorderPartners } from '@/app/admin/_actions/partners'
import { resolveImageUrl } from '@/lib/r2'
import { PartnerVisibilityToggle } from './PartnerVisibilityToggle'

export interface PartnerListRow {
  id: string
  name: string
  url: string | null
  category: string
  display_order: number
  active: boolean
  logo_storage_path: string | null
  logo_url: string | null
}

/** Grouping mirrors the three public grids in CreditsSection. */
const PARTNER_GROUPS: Array<{
  id: string
  label: string
  matches: (category: string) => boolean
}> = [
  { id: 'credit', label: 'Credits', matches: (category) => category === 'credit' },
  { id: 'endorsement', label: 'Endorsements', matches: (category) => category === 'endorsement' },
  {
    id: 'partner',
    label: 'Partners & Friends',
    matches: (category) => category !== 'credit' && category !== 'endorsement',
  },
]

function groupPartners(partners: PartnerListRow[]) {
  const sorted = [...partners].sort((a, b) => a.display_order - b.display_order)
  return PARTNER_GROUPS.map((group) => ({
    ...group,
    items: sorted.filter((partner) => group.matches(partner.category)),
  }))
}

function PartnerRow({
  partner,
  deleting,
  onDelete,
}: {
  partner: PartnerListRow
  deleting: boolean
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: partner.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const logoUrl = resolveImageUrl(partner.logo_storage_path, partner.logo_url)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900 px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${partner.name}`}
        className="shrink-0 cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M108,60a16,16,0,1,1-16-16A16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,176a16,16,0,1,0,16,16A16,16,0,0,0,92,176Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,176Z" />
        </svg>
      </button>

      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
        {logoUrl ? (
          <Image src={logoUrl} alt="" fill className="object-contain p-1" unoptimized />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-zinc-600">—</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{partner.name}</p>
        <p className="truncate text-xs capitalize text-zinc-500">{partner.category}</p>
      </div>

      <PartnerVisibilityToggle partnerId={partner.id} active={partner.active ?? true} />

      <Link
        href={`/admin/partners/${partner.id}`}
        className="text-xs text-zinc-400 hover:text-white"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onDelete(partner.id)}
        disabled={deleting}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}

interface PartnersSortableProps {
  initialPartners: PartnerListRow[]
}

export function PartnersSortable({ initialPartners }: PartnersSortableProps) {
  const router = useRouter()
  const [partners, setPartners] = useState<PartnerListRow[]>(initialPartners)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const groups = useMemo(() => groupPartners(partners), [partners])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function persistOrder(orderedIds: string[]) {
    setSaving(true)
    setError(null)
    const result = await reorderPartners(orderedIds)
    setSaving(false)
    if (result?.error) {
      setError(result.error)
      setPartners(initialPartners)
      return
    }
    router.refresh()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceGroup = groups.find((group) => group.items.some((p) => p.id === active.id))
    const targetGroup = groups.find((group) => group.items.some((p) => p.id === over.id))
    // Reordering across sections is not supported — section = category (edit page).
    if (!sourceGroup || !targetGroup || sourceGroup.id !== targetGroup.id) return

    const oldIndex = sourceGroup.items.findIndex((p) => p.id === active.id)
    const newIndex = sourceGroup.items.findIndex((p) => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const nextItems = arrayMove(sourceGroup.items, oldIndex, newIndex)
    const nextPartners = groups
      .flatMap((group) => (group.id === sourceGroup.id ? nextItems : group.items))
      .map((partner, index) => ({ ...partner, display_order: index }))

    setPartners(nextPartners)
    void persistOrder(nextPartners.map((p) => p.id))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deletePartner(id)
    setDeletingId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    setPartners((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span>
          Drag a row within its section to set the order on the public site. Changes save
          immediately.
        </span>
        {saving ? <span className="text-zinc-400">Saving…</span> : null}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {group.label} <span className="text-zinc-600">({group.items.length})</span>
              </h3>
              <SortableContext
                items={group.items.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {group.items.length === 0 ? (
                    <p className="text-xs text-zinc-600">No entries in this section.</p>
                  ) : (
                    group.items.map((partner) => (
                      <PartnerRow
                        key={partner.id}
                        partner={partner}
                        deleting={deletingId === partner.id}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </section>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
