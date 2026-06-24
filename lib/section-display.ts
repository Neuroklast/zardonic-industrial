/** Default public headings when site_config.sections[].label is empty. */
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
  newsletter: 'Stay Connected',
  contact: 'Contact',
}

export function formatSectionHeading(label: string | undefined, sectionId: string): string {
  const raw = label?.trim() || SECTION_DEFAULT_HEADINGS[sectionId] || sectionId
  return raw.toUpperCase()
}