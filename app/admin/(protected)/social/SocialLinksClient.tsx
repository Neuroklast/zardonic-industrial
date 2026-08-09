'use client'

import { useState } from 'react'
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
import { MediaSourcePicker } from '@/app/admin/_components/MediaSourcePicker'
import {
  createSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
  updateSocialLink,
} from '@/app/admin/_actions/social'
import { resolveImageUrl } from '@/lib/r2'
import { toDirectImageUrl } from '@/lib/image-cache'

export interface SocialLinkRow {
  id: string
  platform: string
  url: string
  label: string | null
  display_order: number
  logo_storage_path: string | null
  logo_url: string | null
}

function SortableRow({
  link,
  onDelete,
  onLogo,
}: {
  link: SocialLinkRow
  onDelete: (id: string) => void
  onLogo: (id: string, path: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const logoSrc = resolveImageUrl(link.logo_storage_path, link.logo_url)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 rounded border border-zinc-800 bg-zinc-900 p-3 sm:flex-row sm:items-center"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${link.platform}`}
        className="shrink-0 cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
          <path d="M108,60a16,16,0,1,1-16-16A16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,176a16,16,0,1,0,16,16A16,16,0,0,0,92,176Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,176Z" />
        </svg>
      </button>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-700 bg-zinc-950">
        {logoSrc ? (
          <img
            src={toDirectImageUrl(logoSrc, { w: 80 }) || logoSrc}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="font-mono text-[10px] uppercase text-zinc-500">
            {link.platform.slice(0, 2)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{link.platform}</p>
        <p className="truncate text-xs text-zinc-500">{link.url}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MediaSourcePicker
          label="Logo"
          storagePrefix="social-logos"
          editorFitMode="contain"
          onResolved={(path) => onLogo(link.id, path)}
        />
        <button
          type="button"
          onClick={() => onDelete(link.id)}
          className="text-xs text-red-400 transition-colors hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function SocialLinksClient({ initialLinks }: { initialLinks: SocialLinkRow[] }) {
  const router = useRouter()
  const [links, setLinks] = useState(initialLinks)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newLogoPath, setNewLogoPath] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(links, oldIndex, newIndex).map((link, i) => ({
      ...link,
      display_order: i,
    }))
    setLinks(next)

    const result = await reorderSocialLinks(next.map((l) => l.id))
    if (result?.error) {
      setError(result.error)
      setLinks(initialLinks)
    } else {
      router.refresh()
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    if (newLogoPath) {
      fd.set('logo_storage_path', newLogoPath)
      fd.set('logo_url', '')
    }
    fd.set('display_order', String(links.length))
    const result = await createSocialLink(fd)
    setSaving(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    form.reset()
    setNewLogoPath(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setError(null)
    const result = await deleteSocialLink(id)
    if (result?.error) {
      setError(result.error)
      return
    }
    setLinks((prev) => prev.filter((l) => l.id !== id))
    router.refresh()
  }

  async function handleLogo(id: string, path: string) {
    setError(null)
    const link = links.find((l) => l.id === id)
    if (!link) return
    const fd = new FormData()
    fd.set('platform', link.platform)
    fd.set('url', link.url)
    if (link.label) fd.set('label', link.label)
    fd.set('display_order', String(link.display_order))
    fd.set('logo_storage_path', path)
    fd.set('logo_url', '')
    const result = await updateSocialLink(id, fd)
    if (result?.error) {
      setError(result.error)
      return
    }
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, logo_storage_path: path, logo_url: null } : l,
      ),
    )
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Add New Link</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Platform *</label>
              <input
                name="platform"
                required
                placeholder="Spotify"
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">URL *</label>
              <input
                name="url"
                type="url"
                required
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <MediaSourcePicker
            label="Custom logo (optional)"
            storagePrefix="social-logos"
            editorFitMode="contain"
            onResolved={(path) => setNewLogoPath(path)}
            onError={setError}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Link'}
          </button>
        </form>
      </div>

      {links.length > 0 ? (
        <div>
          <h2 className="mb-4 text-sm font-medium text-zinc-400">
            Existing Links — drag to reorder
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableRow
                    key={link.id}
                    link={link}
                    onDelete={handleDelete}
                    onLogo={handleLogo}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No social links yet.</p>
      )}
    </div>
  )
}
