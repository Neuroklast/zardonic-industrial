'use client'

import { useState } from 'react'
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
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { updateSiteConfig } from '@/app/admin/_actions/siteConfig'

export interface SectionConfig {
  id: string
  label: string
  visible: boolean
  order: number
}

interface SectionRowProps {
  section: SectionConfig
  onToggle: (id: string, visible: boolean) => void
}

function SectionRow({ section, onToggle }: SectionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 gap-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${section.label}`}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 256 256"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M108,60a16,16,0,1,1-16-16A16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,176a16,16,0,1,0,16,16A16,16,0,0,0,92,176Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,176Z" />
        </svg>
      </button>
      <span className="flex-1 text-sm text-zinc-200">{section.label}</span>
      <SwitchPrimitive.Root
        checked={section.visible}
        onCheckedChange={(checked) => onToggle(section.id, checked)}
        aria-label={`Toggle ${section.label} visibility`}
        className="relative inline-flex h-5 w-9 items-center rounded-full border border-zinc-600 transition-colors data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-zinc-700 focus:outline-none"
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
      </SwitchPrimitive.Root>
    </div>
  )
}

interface SectionsSortableProps {
  initialSections: SectionConfig[]
}

export function SectionsSortable({ initialSections }: SectionsSortableProps) {
  const [sections, setSections] = useState<SectionConfig[]>(
    [...initialSections].sort((a, b) => a.order - b.order),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
    })
  }

  function handleToggle(id: string, visible: boolean) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible } : s)))
  }

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    const payload = sections.map((s, i) => ({ ...s, order: i }))
    const fd = new FormData()
    fd.set('key', 'sections')
    fd.set('value', JSON.stringify(payload))
    const result = await updateSiteConfig(fd)
    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-zinc-500">
        Drag rows to reorder sections. Toggle the switch to show/hide a section on the frontpage.
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {sections.map((section) => (
              <SectionRow key={section.id} section={section} onToggle={handleToggle} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-4 py-2 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save Order & Visibility'}
        </button>
        {status === 'saved' && <span className="text-xs text-green-400">Saved</span>}
        {status === 'error' && <span className="text-xs text-red-400">{errorMsg ?? 'Error'}</span>}
      </div>
    </div>
  )
}
