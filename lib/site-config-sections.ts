export interface SectionConfig {
  id: string
  /** Public section heading (shown uppercase on the site). */
  label: string
  /** Optional subtitle below the heading. */
  intro?: string
  visible: boolean
  order: number
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Hero', visible: true, order: 0 },
  { id: 'bio', label: 'Biography', visible: true, order: 1 },
  { id: 'credits', label: 'Credits & Partners', visible: true, order: 2 },
  { id: 'gallery', label: 'Gallery', visible: true, order: 3 },
  { id: 'music-highlights', label: 'Music Highlights', visible: true, order: 4 },
  { id: 'releases', label: 'Discography', visible: true, order: 5 },
  { id: 'merchandise', label: 'Merchandise', visible: true, order: 6 },
  { id: 'soundpacks', label: 'Soundpacks', visible: true, order: 7 },
  { id: 'gigs', label: 'Events', visible: true, order: 8 },
  { id: 'news', label: 'News', visible: true, order: 9 },
  { id: 'newsletter', label: 'Newsletter', visible: true, order: 10 },
  { id: 'contact', label: 'Contact', visible: true, order: 11 },
]

export const EXCLUDED_HOME_SECTION_IDS = new Set(['social', 'connect', 'spotify'])

export function withoutExcludedSections(items: SectionConfig[]): SectionConfig[] {
  return items.filter((section) => !EXCLUDED_HOME_SECTION_IDS.has(section.id))
}

/** Merge saved sections with defaults so newly added section ids appear without a DB rewrite. */
export function mergeWithDefaultSections(parsed: SectionConfig[]): SectionConfig[] {
  const byId = new Map(parsed.map((s) => [s.id, s]))
  const maxOrder = parsed.reduce((max, s) => Math.max(max, s.order), -1)
  let nextOrder = maxOrder + 1
  const merged = [...parsed]
  for (const def of DEFAULT_SECTIONS) {
    if (!byId.has(def.id)) {
      merged.push({ ...def, order: nextOrder++, visible: def.visible })
    }
  }
  return merged
}

export function parseSections(raw: unknown): SectionConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_SECTIONS
  const parsed = raw
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
    )
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      label: typeof item.label === 'string' ? item.label : '',
      intro: typeof item.intro === 'string' ? item.intro : undefined,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      order: typeof item.order === 'number' ? item.order : 0,
    }))
    .filter((s) => s.id !== '')
  if (parsed.length === 0) return DEFAULT_SECTIONS
  return mergeWithDefaultSections(parsed)
}