'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
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
  rectSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export { rectSortingStrategy, verticalListSortingStrategy }

type SortableBind = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function DragHandle({
  label,
  attributes,
  listeners,
}: {
  label: string
} & SortableBind) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder ${label}`}
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
  )
}

export function AdminSortableItem({
  id,
  label,
  className,
  children,
}: {
  id: string
  label: string
  className?: string
  children: (handle: ReactNode) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(<DragHandle label={label} attributes={attributes} listeners={listeners} />)}
    </div>
  )
}

export function AdminSortableList<T extends { id: string }>({
  items,
  onItemsChange,
  onReorder,
  strategy = verticalListSortingStrategy,
  className,
  hint = 'Drag to set the order on the public site. Changes save immediately.',
  children,
}: {
  items: T[]
  onItemsChange: (next: T[]) => void
  onReorder: (orderedIds: string[]) => Promise<{ error?: string } | undefined | void>
  strategy?: SortingStrategy
  className?: string
  hint?: string
  children: (item: T) => ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function persist(orderedIds: string[], previous: T[]) {
    setSaving(true)
    setError(null)
    try {
      const result = await onReorder(orderedIds)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        onItemsChange(previous)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save order.')
      onItemsChange(previous)
    } finally {
      setSaving(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const previous = items
    const next = arrayMove(items, oldIndex, newIndex)
    onItemsChange(next)
    void persist(
      next.map((item) => item.id),
      previous,
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span>{hint}</span>
        {saving ? <span className="text-zinc-400">Saving…</span> : null}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={strategy}>
          <div className={className}>{items.map((item) => children(item))}</div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
