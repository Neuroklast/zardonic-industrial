/**
 * SectionsManager — drag & drop reordering and enable/disable for homepage sections.
 */

import { useState, useEffect } from 'react'
import { CmsTopBar } from '../components/CmsTopBar'
import { SortableList } from '../components/SortableList'
import { useSections, useUpdateSection, useReorderSections } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Section { id: string; type: string; title?: string; enabled: boolean; sortOrder: number }

export function SectionsManager() {
  const { data, isLoading } = useSections()
  const updateSection = useUpdateSection()
  const reorderSections = useReorderSections()
  const [sections, setSections] = useState<Section[]>([])

  useEffect(() => { if (data) setSections(data as Section[]) }, [data])

  async function handleReorder(reordered: Section[]) {
    setSections(reordered)
    try {
      await reorderSections.mutateAsync(
        reordered.map((s, i) => ({ id: s.id, sortOrder: i }))
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Sortieren')
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled } : s))
    try {
      await updateSection.mutateAsync({ id, enabled } as Record<string, unknown> & { id: string })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    }
  }

  if (isLoading) return <div className="p-6 text-zinc-500 font-mono text-sm">Lädt…</div>

  return (
    <div className="flex-1 overflow-auto">
      <CmsTopBar title="Sections" breadcrumbs={['CMS', 'Sections']} />
      <div className="p-6 max-w-2xl">
        <p className="text-xs font-mono text-zinc-500 mb-4">// Ziehen zum Sortieren. Klick-Toggle zum Ein/Ausblenden.</p>
        <SortableList
          items={sections}
          onReorder={handleReorder}
          renderItem={(section) => (
            <div className="flex items-center justify-between px-4 py-3 border border-zinc-700 bg-[#111] hover:border-zinc-500 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 font-mono text-xs">⠿</span>
                <span className="text-sm font-mono text-zinc-200">{section.title ?? section.type}</span>
                <span className="text-xs font-mono text-zinc-600">{section.type}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer" onClick={e => e.stopPropagation()}>
                <span className="text-xs font-mono text-zinc-500">{section.enabled ? 'ON' : 'OFF'}</span>
                <button
                  onClick={() => { void toggleEnabled(section.id, !section.enabled) }}
                  className={`w-10 h-5 border transition-colors relative ${section.enabled ? 'border-red-600 bg-red-950/30' : 'border-zinc-700 bg-zinc-900'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 border transition-all ${section.enabled ? 'left-5 border-red-500' : 'left-0.5 border-zinc-600'} bg-current`} />
                </button>
              </label>
            </div>
          )}
        />
      </div>
    </div>
  )
}
