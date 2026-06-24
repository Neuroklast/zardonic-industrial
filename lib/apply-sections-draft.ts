import { formatSectionHeading } from '@/lib/section-display'

export interface SectionsDraftEntry {
  id: string
  label?: string
  intro?: string
  visible: boolean
  order: number
}

const EXCLUDED_SECTION_IDS = new Set(['social', 'connect', 'spotify'])

export function parseSectionsDraft(value: Record<string, unknown>): SectionsDraftEntry[] {
  const raw = value.sections
  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : '',
      label: typeof item.label === 'string' ? item.label : undefined,
      intro: typeof item.intro === 'string' ? item.intro : undefined,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      order: typeof item.order === 'number' ? item.order : index,
    }))
    .filter((s) => s.id !== '' && !EXCLUDED_SECTION_IDS.has(s.id))
}

/** Apply section order/visibility in the live-preview iframe via data-draft-section wrappers. */
export function applySectionsDraft(value: Record<string, unknown>): void {
  if (typeof document === 'undefined') return

  const sections = parseSectionsDraft(value)
  if (sections.length === 0) return

  for (const section of sections) {
    const el = document.querySelector<HTMLElement>(`[data-draft-section="${section.id}"]`)
    if (el) {
      el.style.order = String(section.order)
      el.style.display = section.visible ? '' : 'none'
    }

    const headingEl = document.querySelector<HTMLElement>(`[data-draft-target="section-heading-${section.id}"]`)
    if (headingEl) {
      const text = formatSectionHeading(section.label, section.id)
      headingEl.dataset.text = text
      let pulse = headingEl.querySelector('span.animate-pulse')
      if (!pulse) {
        pulse = document.createElement('span')
        pulse.className = 'animate-pulse'
        pulse.textContent = '_'
      }
      headingEl.replaceChildren(text, pulse)
    }

    const introEl = document.querySelector<HTMLElement>(`[data-draft-target="section-intro-${section.id}"]`)
    if (introEl) {
      const intro = section.intro?.trim() ?? ''
      introEl.textContent = intro
      introEl.style.display = intro ? '' : 'none'
    }
  }
}