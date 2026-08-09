import type { Icon } from '@phosphor-icons/react'
import {
  User,
  Handshake,
  Images,
  MusicNotes,
  Disc,
  TShirt,
  Waveform,
  CalendarBlank,
  Newspaper,
  EnvelopeSimple,
  ChatCircleDots,
  Circle,
} from '@phosphor-icons/react'

/**
 * Phosphor icon per public section id (desktop nav: icon at rest, label on hover).
 * Keep in sync with SECTION_ANCHOR_BY_ID / NAV_DEFAULT_LABELS in nav-links.ts.
 */
export const NAV_ICONS: Record<string, Icon> = {
  bio: User,
  credits: Handshake,
  gallery: Images,
  'music-highlights': MusicNotes,
  releases: Disc,
  merchandise: TShirt,
  soundpacks: Waveform,
  gigs: CalendarBlank,
  news: Newspaper,
  newsletter: EnvelopeSimple,
  contact: ChatCircleDots,
}

export function getNavIcon(sectionId: string): Icon {
  return NAV_ICONS[sectionId] ?? Circle
}

/** Section ids that must appear in the default nav icon map (regression guard). */
export const NAV_ICON_SECTION_IDS = Object.keys(NAV_ICONS)
