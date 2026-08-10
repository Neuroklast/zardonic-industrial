/** Default public headings when site_config.sections[].label is empty (English). */
export const SECTION_DEFAULT_HEADINGS: Record<string, string> = {
  hero: 'Hero',
  bio: 'Biography',
  credits: 'Credit Highlights',
  gallery: 'Gallery',
  'music-highlights': 'Music Highlights',
  releases: 'Releases',
  merchandise: 'Merchandise',
  soundpacks: 'Soundpacks & Presets',
  gigs: 'Tour Dates',
  news: 'News',
  newsletter: 'Stay Connected',
  contact: 'Contact',
}

/** i18n keys for public section titles (chrome). Custom admin labels are shown as-is. */
export const SECTION_TITLE_I18N_KEYS: Record<string, string> = {
  bio: 'section.bio',
  credits: 'section.credits',
  gallery: 'section.gallery',
  'music-highlights': 'section.musicHighlights',
  releases: 'section.releases',
  merchandise: 'section.merchandise',
  soundpacks: 'section.soundpacks',
  gigs: 'section.gigs',
  news: 'section.news',
  newsletter: 'section.newsletter',
  contact: 'section.contact',
}

export function formatSectionHeading(label: string | undefined, sectionId: string): string {
  const raw = label?.trim() || SECTION_DEFAULT_HEADINGS[sectionId] || sectionId
  return raw.toUpperCase()
}

/**
 * Locale-aware section title for public chrome.
 * - Empty / English default label → translated section.* key
 * - Custom admin label → kept (CMS content, not chrome)
 */
export function resolveSectionHeading(
  label: string | undefined,
  sectionId: string,
  translate: (key: string) => string,
): string {
  const defaultEn = SECTION_DEFAULT_HEADINGS[sectionId] ?? sectionId
  const raw = label?.trim()
  const isDefault = !raw || raw.toUpperCase() === defaultEn.toUpperCase()
  if (isDefault) {
    const key = SECTION_TITLE_I18N_KEYS[sectionId]
    if (key) {
      const translated = translate(key)
      if (translated && translated !== key) return translated.toUpperCase()
    }
    return defaultEn.toUpperCase()
  }
  return raw.toUpperCase()
}
