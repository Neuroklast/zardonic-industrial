import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { BackgroundStack } from './_components/public/BackgroundStack'
import { GallerySection } from './_components/public/GallerySection'
import { GlobalEffects } from './_components/public/GlobalEffects'
import { SiteNav } from './_components/public/SiteNav'
import { HeroSection } from './_components/public/HeroSection'
import { BioSection } from './_components/public/BioSection'
import { CreditsSection } from './_components/public/CreditsSection'
import { MusicHighlightsSection } from './_components/public/MusicHighlightsSection'
import { ReleasesSection } from './_components/public/ReleasesSection'
import { MerchandiseSection } from './_components/public/MerchandiseSection'
import { SoundpacksSection } from './_components/public/SoundpacksSection'
import { GigsSection } from './_components/public/GigsSection'
import { NewsletterSection } from './_components/public/NewsletterSection'
import { ContactSection } from './_components/public/ContactSection'
import { SiteFooter } from './_components/public/SiteFooter'
import { SectionDivider } from './_components/public/SectionWrapper'
import { SocialSection } from './_components/public/SocialSection'
import { SpotifySection } from './_components/public/SpotifySection'

// Revalidate at most once per minute for quick admin updates
export const revalidate = 60

// ─── Type helpers ────────────────────────────────────────────────────────────
interface SiteConfigRow { key: string; value: Record<string, unknown> }
interface BioRow { content: string | null }
interface GigRow {
  id: string; title: string; venue: string | null; city: string | null
  country: string | null; event_date: string; ticket_url: string | null
  festival_name: string | null
}
interface ReleaseRow {
  id: string; title: string; type: string; release_date: string | null
  cover_storage_path: string | null; cover_url: string | null
  streaming_links: unknown
}
interface PartnerRow {
  id: string; name: string; url: string | null
  logo_storage_path: string | null; logo_url: string | null; category: string
}
interface MusicHighlightRow {
  id: string; title: string; youtube_url: string; description: string | null
}
interface CommerceItemRow {
  id: string; title: string
  image_storage_path: string | null; image_url: string | null; external_url: string | null
}
interface GalleryItemRow {
  id: string; alt: string | null
  storage_path: string | null; image_url: string | null
}
interface SocialRow { id: string; platform: string; url: string; label: string | null }
interface SectionConfig { id: string; label: string; visible: boolean; order: number }

// ─── Data fetching ────────────────────────────────────────────────────────────
async function fetchAll() {
  try {
    const supabase = await createClient()

    const [
      { data: configRows },
      { data: bioRows },
      { data: gigRows },
      { data: releaseRows },
      { data: partnerRows },
      { data: musicRows },
      { data: merchRows },
      { data: soundpackRows },
      { data: galleryRows },
      { data: socialRows },
    ] = await Promise.all([
      supabase.from('site_config').select('key, value'),
      supabase.from('bio').select('content').limit(1).single(),
      supabase.from('gigs').select('id, title, venue, city, country, event_date, ticket_url, festival_name').eq('active', true).order('event_date', { ascending: true }),
      supabase.from('releases').select('id, title, type, release_date, cover_storage_path, cover_url, streaming_links').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('partners').select('id, name, url, logo_storage_path, logo_url, category').order('display_order', { ascending: true }),
      supabase.from('music_highlights').select('id, title, youtube_url, description').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('merchandise').select('id, title, image_storage_path, image_url, external_url').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('soundpacks').select('id, title, image_storage_path, image_url, external_url').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('gallery').select('id, alt, storage_path, image_url').order('display_order', { ascending: true }),
      supabase.from('social_links').select('id, platform, url, label').order('display_order', { ascending: true }),
    ])

    return {
      configRows: (configRows ?? []) as SiteConfigRow[],
      bio: (bioRows as BioRow | null)?.content ?? '',
      gigs: (gigRows ?? []) as GigRow[],
      releases: (releaseRows ?? []) as ReleaseRow[],
      partners: (partnerRows ?? []) as PartnerRow[],
      musicHighlights: (musicRows ?? []) as MusicHighlightRow[],
      merch: (merchRows ?? []) as CommerceItemRow[],
      soundpacks: (soundpackRows ?? []) as CommerceItemRow[],
      gallery: (galleryRows ?? []) as GalleryItemRow[],
      social: (socialRows ?? []) as SocialRow[],
    }
  } catch {
    // Return safe empty defaults when Supabase is not configured (local dev)
    return {
      configRows: [] as SiteConfigRow[],
      bio: '',
      gigs: [] as GigRow[],
      releases: [] as ReleaseRow[],
      partners: [] as PartnerRow[],
      musicHighlights: [] as MusicHighlightRow[],
      merch: [] as CommerceItemRow[],
      soundpacks: [] as CommerceItemRow[],
      gallery: [] as GalleryItemRow[],
      social: [] as SocialRow[],
    }
  }
}

function getConfig(rows: SiteConfigRow[], key: string): Record<string, unknown> {
  return rows.find((r) => r.key === key)?.value ?? {}
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero',             label: 'Hero',               visible: true, order: 0  },
  { id: 'bio',              label: 'Biography',          visible: true, order: 1  },
  { id: 'credits',          label: 'Credits & Partners', visible: true, order: 2  },
  { id: 'gallery',          label: 'Gallery',            visible: true, order: 3  },
  { id: 'music-highlights', label: 'Music Highlights',   visible: true, order: 4  },
  { id: 'releases',         label: 'Discography',        visible: true, order: 5  },
  { id: 'social',           label: 'Connect',            visible: true, order: 6  },
  { id: 'spotify',          label: 'Music Stream',       visible: true, order: 7  },
  { id: 'merchandise',      label: 'Merchandise',        visible: true, order: 8  },
  { id: 'soundpacks',       label: 'Soundpacks',         visible: true, order: 9  },
  { id: 'gigs',             label: 'Events',             visible: true, order: 10 },
  { id: 'newsletter',       label: 'Newsletter',         visible: true, order: 11 },
  { id: 'contact',          label: 'Contact',            visible: true, order: 12 },
]

function parseSections(raw: unknown): SectionConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_SECTIONS
  const parsed = raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      label: typeof item.label === 'string' ? item.label : '',
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      order: typeof item.order === 'number' ? item.order : 0,
    }))
    .filter((s) => s.id !== '')
  return parsed.length > 0 ? parsed : DEFAULT_SECTIONS
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const {
    configRows, bio, gigs, releases, partners,
    musicHighlights, merch, soundpacks, gallery, social,
  } = await fetchAll()

  const heroConfig = getConfig(configRows, 'hero')
  const newsletterConfig = getConfig(configRows, 'newsletter')
  const merchandiseConfig = getConfig(configRows, 'merchandise')
  const footerConfig = getConfig(configRows, 'footer')
  const bgConfig = getConfig(configRows, 'background')
  const appearanceConfig = getConfig(configRows, 'appearance')
  const sectionsRaw = configRows.find((r) => r.key === 'sections')?.value
  const sections = parseSections(sectionsRaw)
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible)

  // Background image: use R2 path or fallback to configured URL or placeholder
  const bgStoragePath = typeof bgConfig.storage_path === 'string' ? bgConfig.storage_path : null
  const bgFallback = typeof bgConfig.url === 'string' ? bgConfig.url : '/assets/bg-placeholder.jpg'
  const backgroundUrl = resolveImageUrl(bgStoragePath, bgFallback) ?? bgFallback
  // Background video (optional): R2 path or direct URL
  const bgVideoPath = typeof bgConfig.video_storage_path === 'string' ? bgConfig.video_storage_path : null
  const bgVideoFallback = typeof bgConfig.video_url === 'string' ? bgConfig.video_url : null
  const backgroundVideoUrl = resolveImageUrl(bgVideoPath, bgVideoFallback)
  const rawBackgroundType = typeof bgConfig.backgroundType === 'string' ? bgConfig.backgroundType : ''
  const backgroundType = rawBackgroundType === 'circuit' || rawBackgroundType === 'minimal' || rawBackgroundType === 'matrix'
    ? rawBackgroundType
    : 'matrix'
  const backgroundOpacity = typeof bgConfig.backgroundImageOpacity === 'number' ? bgConfig.backgroundImageOpacity : 0.6

  // Appearance config
  const crtEnabled = typeof appearanceConfig.crtEnabled === 'boolean' ? appearanceConfig.crtEnabled : true
  const scanlineEnabled = typeof appearanceConfig.scanlineEnabled === 'boolean' ? appearanceConfig.scanlineEnabled : true
  const noiseEnabled = typeof appearanceConfig.noiseEnabled === 'boolean' ? appearanceConfig.noiseEnabled : true
  const accentColor = typeof appearanceConfig.accentColor === 'string' ? appearanceConfig.accentColor : '#dc2626'
  const accentColorSecondary = typeof appearanceConfig.accentColorSecondary === 'string' ? appearanceConfig.accentColorSecondary : '#7c3aed'

  // Spotify: derive embed URI from social_links or site_config
  const spotifyRow = social.find((s) => s.platform.toLowerCase() === 'spotify')
  const spotifyUri = (() => {
    const url = spotifyRow?.url ?? ''
    if (!url) return 'spotify:artist:7BqEidErPMNiUXCRE0dV2n'
    try {
      const { hostname, pathname } = new URL(url)
      if (hostname !== 'open.spotify.com' && !hostname.endsWith('.spotify.com')) return url
      const parts = pathname.replace(/^\//, '').split('/').filter((p) => !p.startsWith('intl-'))
      if (parts.length >= 2 && parts[0] && parts[1]) return `spotify:${parts[0]}:${parts[1]}`
    } catch { /* ignore */ }
    return 'spotify:artist:7BqEidErPMNiUXCRE0dV2n'
  })()

  // Releases: convert streaming_links to typed array
  const releaseItems = releases.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    release_date: r.release_date,
    coverUrl: resolveImageUrl(r.cover_storage_path, r.cover_url),
    streamingLinks: Array.isArray(r.streaming_links)
      ? (r.streaming_links as Array<{ platform: string; url: string }>).filter(
          (l) => typeof l.platform === 'string' && typeof l.url === 'string',
        )
      : [],
  }))

  // Partners split by category
  const credits = partners
    .filter((p) => p.category === 'credit')
    .map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      logoUrl: resolveImageUrl(p.logo_storage_path, p.logo_url),
      category: p.category,
    }))
  const endorsements = partners
    .filter((p) => p.category === 'endorsement')
    .map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      logoUrl: resolveImageUrl(p.logo_storage_path, p.logo_url),
      category: p.category,
    }))

  const commerceItemMap = (row: CommerceItemRow) => ({
    id: row.id,
    title: row.title,
    imageUrl: resolveImageUrl(row.image_storage_path, row.image_url),
    externalUrl: row.external_url,
  })
  const galleryItemMap = (row: GalleryItemRow) => ({
    id: row.id,
    alt: row.alt,
    imageUrl: resolveImageUrl(row.storage_path, row.image_url),
  })

  // Gigs: split upcoming vs past
  const now = new Date()
  const upcoming = gigs.filter((g) => new Date(g.event_date) >= now)
  const past = gigs.filter((g) => new Date(g.event_date) < now).reverse()

  // Helper: is a section visible?
  function isSectionVisible(id: string) {
    return sections.some((s) => s.id === id)
  }

  return (
    <div className="min-h-screen text-white">
      {/* Inject accent colors as CSS custom properties */}
      <style>{`:root { --accent: ${accentColor}; --accent-secondary: ${accentColorSecondary}; }`}</style>

      <GlobalEffects crtEnabled={crtEnabled} scanlineEnabled={scanlineEnabled} noiseEnabled={noiseEnabled} />
      <BackgroundStack
        imageUrl={backgroundUrl}
        videoUrl={backgroundVideoUrl ?? undefined}
        backgroundType={backgroundType}
        imageOpacity={backgroundOpacity}
      />

      {/* Fixed navigation */}
      <SiteNav />

      {/* Main content – sections rendered in DB-controlled order */}
      <main>
        {sections.map((section, idx) => {
          const divider = idx > 0 ? <SectionDivider /> : null
          switch (section.id) {
            case 'hero':
              return (
                <div key="hero">
                  <HeroSection
                    headline={String(heroConfig.headline ?? 'ZARDONIC')}
                    tagline={String(heroConfig.tagline ?? '')}
                    ctaLabel={String(heroConfig.ctaLabel ?? 'LISTEN NOW')}
                    ctaUrl={String(heroConfig.ctaUrl ?? '#releases')}
                    backgroundImageUrl={typeof heroConfig.backgroundImageUrl === 'string' ? heroConfig.backgroundImageUrl : backgroundUrl}
                    backgroundImageOpacity={typeof heroConfig.backgroundImageOpacity === 'number' ? heroConfig.backgroundImageOpacity : 0.35}
                  />
                </div>
              )
            case 'bio':
              return (
                <div key="bio">
                  {divider}
                  <BioSection content={bio} />
                </div>
              )
            case 'credits':
              return (
                <div key="credits">
                  {divider}
                  <CreditsSection credits={credits} endorsements={endorsements} />
                </div>
              )
            case 'gallery':
              return (
                <div key="gallery">
                  {divider}
                  <GallerySection items={gallery.map(galleryItemMap)} />
                </div>
              )
            case 'music-highlights':
              return (
                <div key="music-highlights">
                  {divider}
                  <MusicHighlightsSection highlights={musicHighlights} />
                </div>
              )
            case 'releases':
              return (
                <div key="releases">
                  {divider}
                  <ReleasesSection releases={releaseItems} />
                </div>
              )
            case 'social':
              return social.length > 0 ? (
                <div key="social">
                  {divider}
                  <SocialSection links={social} label={section.label} />
                </div>
              ) : null
            case 'spotify':
              return (
                <div key="spotify">
                  {divider}
                  <SpotifySection uri={spotifyUri} label={section.label} />
                </div>
              )
            case 'merchandise':
              return merch.length > 0 ? (
                <div key="merchandise">
                  {divider}
                  <MerchandiseSection
                    items={merch.map(commerceItemMap)}
                    footerText={String(merchandiseConfig.footerText ?? '')}
                  />
                </div>
              ) : null
            case 'soundpacks':
              return soundpacks.length > 0 ? (
                <div key="soundpacks">
                  {divider}
                  <SoundpacksSection items={soundpacks.map(commerceItemMap)} />
                </div>
              ) : null
            case 'gigs':
              return (
                <div key="gigs">
                  {divider}
                  <GigsSection upcoming={upcoming} past={past} />
                </div>
              )
            case 'newsletter':
              return (
                <div key="newsletter">
                  {divider}
                  <NewsletterSection
                    heading={String(newsletterConfig.heading ?? 'Mailing List')}
                    body={String(newsletterConfig.body ?? 'Subscribe to get the latest news and releases.')}
                  />
                </div>
              )
            case 'contact':
              return (
                <div key="contact">
                  {divider}
                  <ContactSection />
                </div>
              )
            default:
              return null
          }
        })}

        {/* Fallback: if sections config is empty or contact not included */}
        {!isSectionVisible('contact') && (
          <>
            <SectionDivider />
            <ContactSection />
          </>
        )}
      </main>

      <SiteFooter
        socialLinks={social}
        impressumUrl={String(footerConfig.impressumUrl ?? '/impressum')}
        privacyUrl={String(footerConfig.privacyUrl ?? '/privacy')}
      />
    </div>
  )
}
