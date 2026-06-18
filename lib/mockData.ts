import type { Release } from '@/lib/schemas/release'
import type { Gig } from '@/lib/schemas/gig'
import type { GalleryImage } from '@/lib/schemas/gallery'
import type { Bio } from '@/lib/schemas/bio'
import type { SocialLink } from '@/lib/schemas/social'
import type { Partner } from '@/lib/schemas/partner'
import type { Soundpack } from '@/lib/schemas/soundpack'
import type { Merchandise } from '@/lib/schemas/merchandise'
import type { MusicHighlight } from '@/lib/schemas/musicHighlight'

export const DEMO_RELEASES: Release[] = [
  {
    id: 'demo-release-1',
    title: 'Bleed For The Machine',
    type: 'album',
    releaseDate: '2024-01-15',
    description: 'Industrial metal album by Zardonic',
    coverUrl: null,
    coverStoragePath: null,
    streamingLinks: [
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/zardonic', label: 'Spotify' },
      { platform: 'Bandcamp', url: 'https://zardonic.bandcamp.com', label: 'Bandcamp' },
    ],
    artists: ['Zardonic'],
    displayOrder: 0,
  },
  {
    id: 'demo-release-2',
    title: 'Anthems of Annihilation',
    type: 'ep',
    releaseDate: '2023-06-20',
    description: 'Industrial/DnB EP',
    coverUrl: null,
    coverStoragePath: null,
    streamingLinks: [],
    artists: ['Zardonic'],
    displayOrder: 1,
  },
]

export const DEMO_GIGS: Gig[] = [
  {
    id: 'demo-gig-1',
    title: 'Zardonic Live at Wacken',
    venue: 'Wacken Open Air',
    city: 'Wacken',
    country: 'Germany',
    eventDate: '2025-08-01T20:00:00Z',
    ticketUrl: 'https://www.wacken.com',
    festivalName: 'Wacken Open Air 2025',
    description: null,
  },
  {
    id: 'demo-gig-2',
    title: 'Zardonic at Brutal Assault',
    venue: 'Josefov Fortress',
    city: 'Jaromers',
    country: 'Czech Republic',
    eventDate: '2025-08-10T19:00:00Z',
    ticketUrl: 'https://www.brutalassault.cz',
    festivalName: 'Brutal Assault 2025',
    description: null,
  },
]

export const DEMO_GALLERY: GalleryImage[] = []

export const DEMO_BIO: Bio = {
  id: 'demo-bio-1',
  content: `Zardonic (Daniel Kaio) is a Venezuelan industrial/metal producer and DJ known for blending extreme metal with aggressive electronic music. With releases on Nuclear Blast, Napalm Records and dozens of major labels, Zardonic has toured worldwide and collaborated with artists from Fear Factory to Necrobeast.`,
}

export const DEMO_SOCIAL_LINKS: SocialLink[] = [
  { id: 'social-1', platform: 'Spotify', url: 'https://open.spotify.com/artist/zardonic', label: 'Spotify', displayOrder: 0 },
  { id: 'social-2', platform: 'Bandcamp', url: 'https://zardonic.bandcamp.com', label: 'Bandcamp', displayOrder: 1 },
  { id: 'social-3', platform: 'YouTube', url: 'https://youtube.com/@zardonic', label: 'YouTube', displayOrder: 2 },
  { id: 'social-4', platform: 'Instagram', url: 'https://instagram.com/zardonic', label: 'Instagram', displayOrder: 3 },
  { id: 'social-5', platform: 'Facebook', url: 'https://facebook.com/zardonic', label: 'Facebook', displayOrder: 4 },
]

export const DEMO_PARTNERS: Partner[] = [
  { id: 'partner-1', name: 'Nuclear Blast', url: 'https://nuclearblast.com', logoUrl: null, logoStoragePath: null, category: 'label', displayOrder: 0 },
  { id: 'partner-2', name: 'Napalm Records', url: 'https://napalmrecords.com', logoUrl: null, logoStoragePath: null, category: 'label', displayOrder: 1 },
]

export const DEMO_SOUNDPACKS: Soundpack[] = [
  { id: 'demo-sp-1', title: 'Industrial Drums Vol.1', imageUrl: null, imageStoragePath: null, externalUrl: 'https://zardonic.bandcamp.com', displayOrder: 0, active: true },
  { id: 'demo-sp-2', title: 'Metal Guitars FX', imageUrl: null, imageStoragePath: null, externalUrl: null, displayOrder: 1, active: true },
]

export const DEMO_MERCHANDISE: Merchandise[] = [
  { id: 'demo-merch-1', title: 'Zardonic T-Shirt', imageUrl: null, imageStoragePath: null, externalUrl: 'https://zardonic.bandcamp.com', displayOrder: 0, active: true },
  { id: 'demo-merch-2', title: 'Industrial Poster', imageUrl: null, imageStoragePath: null, externalUrl: null, displayOrder: 1, active: true },
]

export const DEMO_MUSIC_HIGHLIGHTS: MusicHighlight[] = [
  { id: 'demo-mh-1', title: 'Bleed For The Machine - Official Video', youtubeUrl: 'https://www.youtube.com/watch?v=example1', description: null, displayOrder: 0, active: true },
  { id: 'demo-mh-2', title: 'Live at Wacken 2024', youtubeUrl: 'https://www.youtube.com/watch?v=example2', description: 'Full live set', displayOrder: 1, active: true },
]
