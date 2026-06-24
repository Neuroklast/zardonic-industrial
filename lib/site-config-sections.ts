export interface SectionConfig {
  id: string
  label: string
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
  { id: 'newsletter', label: 'Newsletter', visible: true, order: 9 },
  { id: 'contact', label: 'Contact', visible: true, order: 10 },
]

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
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      order: typeof item.order === 'number' ? item.order : 0,
    }))
    .filter((s) => s.id !== '')
  if (parsed.length === 0) return DEFAULT_SECTIONS
  return parsed
}