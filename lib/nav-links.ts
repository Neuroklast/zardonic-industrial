import {
  DEFAULT_SECTIONS,
  type SectionConfig,
  parseSections,
  withoutExcludedSections,
} from '@/lib/site-config-sections'

export interface NavLink {
  sectionId: string
  href: string
  label: string
}

/** Section config ids that never appear in the main nav (no scroll target or hero). */
export const NAV_EXCLUDED_SECTION_IDS = new Set(['hero', 'social', 'connect', 'spotify'])

/** Maps site_config section id → public DOM anchor id. */
export const SECTION_ANCHOR_BY_ID: Record<string, string> = {
  bio: 'bio',
  credits: 'credits',
  gallery: 'gallery',
  'music-highlights': 'music',
  releases: 'releases',
  merchandise: 'merch',
  soundpacks: 'soundpacks',
  gigs: 'gigs',
  newsletter: 'newsletter',
  contact: 'contact',
}

const NAV_DEFAULT_LABELS: Record<string, string> = {
  bio: 'Bio',
  credits: 'Credits',
  gallery: 'Gallery',
  'music-highlights': 'Music',
  releases: 'Releases',
  merchandise: 'Merch',
  soundpacks: 'Soundpacks',
  gigs: 'Events',
  newsletter: 'Newsletter',
  contact: 'Contact',
}

export function resolveNavLabel(section: Pick<SectionConfig, 'id' | 'label'>): string {
  const trimmed = section.label?.trim()
  if (trimmed) return trimmed
  return NAV_DEFAULT_LABELS[section.id] ?? section.id
}

export function buildNavLinks(sections: SectionConfig[]): NavLink[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .filter(
      (section) =>
        section.visible &&
        !NAV_EXCLUDED_SECTION_IDS.has(section.id) &&
        SECTION_ANCHOR_BY_ID[section.id] != null,
    )
    .map((section) => ({
      sectionId: section.id,
      href: `#${SECTION_ANCHOR_BY_ID[section.id]}`,
      label: resolveNavLabel(section),
    }))
}

export function buildNavLinksFromConfig(raw: unknown): NavLink[] {
  return buildNavLinks(withoutExcludedSections(parseSections(raw)))
}

export function defaultNavLinks(): NavLink[] {
  return buildNavLinks(withoutExcludedSections(DEFAULT_SECTIONS))
}