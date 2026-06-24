import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/r2'
import { PageLayout } from '@/layouts/PageLayout'
import { CookieConsent } from '@/components/CookieConsent'
import KonamiListener from '@/components/KonamiListener'
import { BackgroundStack } from './_components/public/BackgroundStack'
import { GallerySection } from './_components/public/GallerySection'
import { GlobalEffects } from './_components/public/GlobalEffects'
import { SiteNav } from './_components/public/SiteNav'
import { HeroSection } from './_components/public/HeroSection'
import { BioSection } from './_components/public/BioSection'
import { CreditsSection } from './_components/public/CreditsSection'
import { MusicHighlightsSection } from './_components/public/MusicHighlightsSection'
import { PublicPageClient } from './_components/public/PublicPageClient'
import { AppearanceBridge } from './_components/public/AppearanceBridge'
import { AdminDraftListener } from './_components/public/AdminDraftListener'
import { MerchandiseSection } from './_components/public/MerchandiseSection'
import { SoundpacksSection } from './_components/public/SoundpacksSection'
import { GigsSection } from './_components/public/GigsSection'
import { NewsletterSection } from './_components/public/NewsletterSection'
import { ContactSection } from './_components/public/ContactSection'
import { SiteFooter } from './_components/public/SiteFooter'
import { SectionDivider } from './_components/public/SectionWrapper'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { SocialSection } from './_components/public/SocialSection'
import {
  mapReleaseRowToOverlayRelease,
  type ReleaseDbRow,
} from '@/lib/release-public-mapper'

// Revalidate at most once per minute for quick admin updates
export const revalidate = 60

// ─── Type helpers ────────────────────────────────────────────────────────────
interface SiteConfigRow { key: string; value: Record<string, unknown> }
interface BioRow { content: string | null }
interface GigRow {
  id: string; title: string; venue: string | null; city: string | null
  country: string | null; event_date: string; ticket_url: string | null
  festival_name: string | null; description: string | null
}
type ReleaseRow = ReleaseDbRow
interface PartnerRow {
  id: string; name: string; url: string | null
  logo_storage_path: string | null; logo_url: string | null; category: string
  logo_white?: boolean | null
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
async function fetchReleases(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ReleaseRow[]> {
  const fullSelect =
    'id, title, type, release_date, description, cover_storage_path, cover_url, streaming_links, artists, tracks, custom_links, manually_edited'
  const legacySelect =
    'id, title, type, release_date, cover_storage_path, cover_url, streaming_links, manually_edited'
  const minimalSelect =
    'id, title, type, release_date, cover_storage_path, cover_url, streaming_links'

  const { data, error } = await supabase
    .from('releases')
    .select(fullSelect)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (!error) return (data ?? []) as ReleaseRow[]

  console.error('[fetchAll] releases query failed:', error.message)

  const fallbackSelect = error.message.includes('manually_edited') ? minimalSelect : legacySelect
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('releases')
    .select(fallbackSelect)
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (fallbackError) {
    console.error('[fetchAll] releases fallback query failed:', fallbackError.message)
    return []
  }

  return (fallbackData ?? []).map((row: Partial<ReleaseDbRow>) => ({
    ...(row as ReleaseDbRow),
    description: null,
    artists: [],
    tracks: [],
    custom_links: [],
    manually_edited: 'manually_edited' in row ? !!(row as ReleaseDbRow).manually_edited : false,
  }))
}

async function fetchAll() {
  try {
    const supabase = await createClient()

    const [
      configResult,
      bioResult,
      gigResult,
      partnerResult,
      musicResult,
      merchResult,
      soundpackResult,
      galleryResult,
      socialResult,
    ] = await Promise.all([
      supabase.from('site_config').select('key, value'),
      supabase.from('bio').select('content').limit(1).single(),
      supabase.from('gigs').select('id, title, venue, city, country, event_date, ticket_url, festival_name, description').eq('active', true).order('event_date', { ascending: true }),
      supabase.from('partners').select('id, name, url, logo_storage_path, logo_url, category, logo_white').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('music_highlights').select('id, title, youtube_url, description').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('merchandise').select('id, title, image_storage_path, image_url, external_url').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('soundpacks').select('id, title, image_storage_path, image_url, external_url').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('gallery').select('id, alt, storage_path, image_url').eq('active', true).order('display_order', { ascending: true }),
      supabase.from('social_links').select('id, platform, url, label').order('display_order', { ascending: true }),
    ])

    const logQueryError = (label: string, error: { message: string } | null) => {
      if (error) console.error(`[fetchAll] ${label} query failed:`, error.message)
    }

    logQueryError('site_config', configResult.error)
    logQueryError('bio', bioResult.error)
    logQueryError('gigs', gigResult.error)
    logQueryError('partners', partnerResult.error)
    logQueryError('music_highlights', musicResult.error)
    logQueryError('merchandise', merchResult.error)
    logQueryError('soundpacks', soundpackResult.error)
    logQueryError('gallery', galleryResult.error)
    logQueryError('social_links', socialResult.error)

    const releaseRows = await fetchReleases(supabase)

    return {
      configRows: (configResult.data ?? []) as SiteConfigRow[],
      bio: (bioResult.data as BioRow | null)?.content ?? '',
      gigs: (gigResult.data ?? []) as GigRow[],
      releases: releaseRows,
      partners: (partnerResult.data ?? []) as PartnerRow[],
      musicHighlights: (musicResult.data ?? []) as MusicHighlightRow[],
      merch: (merchResult.data ?? []) as CommerceItemRow[],
      soundpacks: (soundpackResult.data ?? []) as CommerceItemRow[],
      gallery: (galleryResult.data ?? []) as GalleryItemRow[],
      social: (socialResult.data ?? []) as SocialRow[],
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
  let sections = parseSections(sectionsRaw)
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible)

  // Per final spec: CONNECT should not be a full section — small logos live in footer only
  sections = sections.filter((s) => s.id !== 'social' && s.id !== 'connect' && s.id !== 'spotify')

  // Extract section style overrides from site_config (centralized helper to avoid repetition)
  // Note: sections config can be array of sections or object with styleOverrides
  const sectionsValue = sectionsRaw
  const overridesRoot: Record<string, unknown> =
    sectionsValue && typeof sectionsValue === 'object' && !Array.isArray(sectionsValue)
      ? ((sectionsValue as Record<string, unknown>).styleOverrides as Record<string, unknown> | undefined)
        ?? (sectionsValue as Record<string, unknown>)
      : {}

  const getSectionOverrides = (key: string): Record<string, unknown> => {
    const value = overridesRoot[key]
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  }

  const releaseOverrides = getSectionOverrides('releases')
  const galleryOverrides = getSectionOverrides('gallery')
  const bioOverrides = getSectionOverrides('bio')
  const heroStyleOverrides = getSectionOverrides('hero')
  const creditOverrides = getSectionOverrides('creditHighlights')

  // Background: Digicide album cover as primary (per final spec) + keep rich scroll video + animated effects
  // Default to a safe placeholder (Digicide cover should be uploaded via admin background config / R2)
  const bgStoragePath = typeof bgConfig.storage_path === 'string' ? bgConfig.storage_path : null
  const bgFallback = typeof bgConfig.url === 'string' && bgConfig.url
    ? bgConfig.url
    : '/assets/bg-placeholder.jpg'
  const backgroundUrl = resolveImageUrl(bgStoragePath, bgFallback) ?? bgFallback

  // Background video (scroll-synced "scroll video") — keep for current look + make performant
  const bgVideoPath = typeof bgConfig.video_storage_path === 'string' ? bgConfig.video_storage_path : null
  const bgVideoFallback = typeof bgConfig.video_url === 'string' ? bgConfig.video_url : null
  const backgroundVideoUrl = resolveImageUrl(bgVideoPath, bgVideoFallback)

  const rawBackgroundType = typeof bgConfig.backgroundType === 'string' ? bgConfig.backgroundType : ''
  const backgroundType = rawBackgroundType === 'circuit' || rawBackgroundType === 'minimal' || rawBackgroundType === 'matrix'
    ? rawBackgroundType
    : 'matrix' // keep animated layers by default for the beloved current aesthetic

  const backgroundOpacity = typeof bgConfig.backgroundImageOpacity === 'number' ? bgConfig.backgroundImageOpacity : 0.55 // slightly more visible album art

  // Appearance config
  const crtEnabled = typeof appearanceConfig.crtEnabled === 'boolean' ? appearanceConfig.crtEnabled : true
  const scanlineEnabled = typeof appearanceConfig.scanlineEnabled === 'boolean' ? appearanceConfig.scanlineEnabled : true
  const noiseEnabled = typeof appearanceConfig.noiseEnabled === 'boolean' ? appearanceConfig.noiseEnabled : true
  const accentColor = typeof appearanceConfig.accentColor === 'string' ? appearanceConfig.accentColor : '#dc2626'
  const accentColorSecondary = typeof appearanceConfig.accentColorSecondary === 'string' ? appearanceConfig.accentColorSecondary : '#7c3aed'
  const faviconStoragePath =
    typeof appearanceConfig.faviconStoragePath === 'string' ? appearanceConfig.faviconStoragePath : null
  const faviconFallback =
    typeof appearanceConfig.faviconUrl === 'string' ? appearanceConfig.faviconUrl : null
  const resolvedFaviconUrl = resolveImageUrl(faviconStoragePath, faviconFallback) ?? undefined

  const appearanceBridgeConfig = {
    crtEnabled,
    scanlineEnabled,
    noiseEnabled,
    accentColor,
    accentColorSecondary,
    vignetteOpacity: typeof appearanceConfig.vignetteOpacity === 'number' ? appearanceConfig.vignetteOpacity : 0.3,
    chromaticStrength: typeof appearanceConfig.chromaticStrength === 'number' ? appearanceConfig.chromaticStrength : 0.5,
    faviconUrl: resolvedFaviconUrl,
    theme:
      appearanceConfig.theme && typeof appearanceConfig.theme === 'object'
        ? (appearanceConfig.theme as Record<string, string>)
        : undefined,
  }

  // Releases: convert streaming_links to typed array
  const releaseItems = releases.map((r) => {
    const coverUrl = resolveImageUrl(r.cover_storage_path, r.cover_url)
    const streamingLinks = Array.isArray(r.streaming_links)
      ? (r.streaming_links as Array<{ platform: string; url: string }>).filter(
          (l) => typeof l.platform === 'string' && typeof l.url === 'string',
        )
      : []
    const overlayRelease = mapReleaseRowToOverlayRelease(r, coverUrl)

    return {
      id: r.id,
      title: r.title,
      type: r.type,
      release_date: r.release_date,
      coverUrl,
      streamingLinks,
      manually_edited: !!r.manually_edited,
      overlayRelease,
    }
  })

  // Partners split by category
  const mapPartnerItem = (p: PartnerRow) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    logoUrl: resolveImageUrl(p.logo_storage_path, p.logo_url),
    category: p.category,
    logoWhite: p.logo_white !== false,
  })

  const credits = partners.filter((p) => p.category === 'credit').map(mapPartnerItem)
  const endorsements = partners.filter((p) => p.category === 'endorsement').map(mapPartnerItem)
  const partnerFriends = partners
    .filter((p) => p.category === 'partner' || p.category === 'label' || p.category === 'sponsor')
    .map(mapPartnerItem)

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

  // Build slots for the mandatory PageLayout (AGENTS §6)
  const backgroundLayers = (
    <BackgroundStack
      imageUrl={backgroundUrl}
      videoUrl={backgroundVideoUrl ?? undefined}
      backgroundType={backgroundType}
      imageOpacity={backgroundOpacity}
    />
  )

  const globalEffectsSlot = (
    <GlobalEffects crtEnabled={crtEnabled} scanlineEnabled={scanlineEnabled} noiseEnabled={noiseEnabled} />
  )

  const navSlot = <SiteNav />

  const legalNoticeUrl = String(
    footerConfig.legalNoticeUrl ?? footerConfig.impressumUrl ?? '/legal-notice',
  )
  const privacyPolicyUrl = String(
    footerConfig.privacyPolicyUrl ?? footerConfig.privacyUrl ?? '/privacy-policy',
  )

  const footerSlot = (
    <SiteFooter
      socialLinks={social}
      legalNoticeUrl={legalNoticeUrl}
      privacyPolicyUrl={privacyPolicyUrl}
    />
  )

  const systemSlot = (
    <>
      <AppearanceBridge config={appearanceBridgeConfig} />
      <AdminDraftListener />
      <CookieConsent privacyPolicyUrl={privacyPolicyUrl} />
      <KonamiListener />
    </>
  )

  // Overlays are managed inside PublicPageClient (release overlay) and other islands.
  // For strict layering they can be hoisted later; leaving in content preserves current behavior + z.
  const overlaysSlot = null

  return (
    <PageLayout
      backgroundLayers={backgroundLayers}
      nav={navSlot}
      footer={footerSlot}
      globalEffects={globalEffectsSlot}
      overlays={overlaysSlot}
      system={systemSlot}
    >
      {/* Main content – sections rendered in DB-controlled order (inside PageLayout <main>) */}
      {sections.map((section, idx) => {
        const divider = idx > 0 ? <SectionDivider /> : null
        switch (section.id) {
          case 'hero':
            return (
              <SectionErrorBoundary key="hero" sectionName="Hero">
                <HeroSection
                  headline={String(heroConfig.headline ?? 'ZARDONIC')}
                  tagline={String(heroConfig.tagline ?? '')}
                  ctaLabel={String(heroConfig.ctaLabel ?? 'LISTEN NOW')}
                  ctaUrl={String(heroConfig.ctaUrl ?? '#releases')}
                  backgroundImageUrl={
                    resolveImageUrl(
                      typeof heroConfig.backgroundImageStoragePath === 'string' ? heroConfig.backgroundImageStoragePath : null,
                      typeof heroConfig.backgroundImageUrl === 'string' ? heroConfig.backgroundImageUrl : null,
                    ) ?? backgroundUrl
                  }
                  backgroundImageOpacity={typeof heroConfig.backgroundImageOpacity === 'number' ? heroConfig.backgroundImageOpacity : 0.35}
                  minHeight={typeof heroStyleOverrides.minHeight === 'string' ? heroStyleOverrides.minHeight : undefined}
                  imageBlur={typeof heroStyleOverrides.heroImageBlur === 'number' ? heroStyleOverrides.heroImageBlur : undefined}
                  paddingTop={typeof heroStyleOverrides.paddingTop === 'string' ? heroStyleOverrides.paddingTop : undefined}
                  showTourDatesCta={isSectionVisible('gigs')}
                />
              </SectionErrorBoundary>
            )
          case 'bio':
            return (
              <SectionErrorBoundary key="bio" sectionName="Bio">
                {divider}
                <BioSection
                  content={bio}
                  bodyFontSize={typeof bioOverrides.bodyFontSize === 'string' ? bioOverrides.bodyFontSize : undefined}
                  readMoreMaxHeight={typeof bioOverrides.readMoreMaxHeight === 'string' ? bioOverrides.readMoreMaxHeight : undefined}
                />
              </SectionErrorBoundary>
            )
          case 'credits':
            return (
              <SectionErrorBoundary key="credits" sectionName="Credits">
                {divider}
                <CreditsSection
                  credits={credits}
                  endorsements={endorsements}
                  partners={partnerFriends}
                  logoBrightness={typeof creditOverrides.logoBrightness === 'number' ? creditOverrides.logoBrightness : undefined}
                />
              </SectionErrorBoundary>
            )
          case 'gallery':
            return (
              <SectionErrorBoundary key="gallery" sectionName="Gallery">
                {divider}
                <GallerySection
                  items={gallery.map(galleryItemMap)}
                  columns={typeof galleryOverrides.columns === 'string' ? galleryOverrides.columns : '3'}
                  maxVisible={typeof galleryOverrides.maxVisible === 'number' ? galleryOverrides.maxVisible : undefined}
                  aspectRatio={typeof galleryOverrides.aspectRatio === 'string' ? galleryOverrides.aspectRatio : undefined}
                  gap={typeof galleryOverrides.gap === 'string' ? galleryOverrides.gap : undefined}
                  lightbox={galleryOverrides.lightbox !== false}
                />
              </SectionErrorBoundary>
            )
          case 'music-highlights':
            return (
              <SectionErrorBoundary key="music-highlights" sectionName="Music Highlights">
                {divider}
                <MusicHighlightsSection highlights={musicHighlights} />
              </SectionErrorBoundary>
            )
          case 'releases':
            return (
              <SectionErrorBoundary key="releases" sectionName="Releases">
                {divider}
                <PublicPageClient
                  releases={releaseItems}
                  artistName={String(heroConfig.headline ?? 'ZARDONIC')}
                  releaseLayout={typeof releaseOverrides.releaseLayout === 'string' && ['grid', 'swipe', 'carousel-3d'].includes(releaseOverrides.releaseLayout) ? (releaseOverrides.releaseLayout as 'grid' | 'swipe' | 'carousel-3d') : 'grid'}
                  releaseColumns={typeof releaseOverrides.releaseColumns === 'string' ? releaseOverrides.releaseColumns : '4'}
                  releaseCardVariant={typeof releaseOverrides.releaseCardVariant === 'string' ? releaseOverrides.releaseCardVariant : undefined}
                  releaseHoverEffect={typeof releaseOverrides.releaseHoverEffect === 'string' ? releaseOverrides.releaseHoverEffect : undefined}
                />
              </SectionErrorBoundary>
            )
          case 'social':
            return social.length > 0 ? (
              <SectionErrorBoundary key="social" sectionName="Social">
                {divider}
                <SocialSection links={social} label={section.label} />
              </SectionErrorBoundary>
            ) : null
          case 'merchandise':
            return (
              <SectionErrorBoundary key="merchandise" sectionName="Merchandise">
                {divider}
                <MerchandiseSection
                  items={merch.map(commerceItemMap)}
                  footerText={String(merchandiseConfig.footerText ?? '')}
                />
              </SectionErrorBoundary>
            )
          case 'soundpacks':
            return (
              <SectionErrorBoundary key="soundpacks" sectionName="Soundpacks">
                {divider}
                <SoundpacksSection items={soundpacks.map(commerceItemMap)} />
              </SectionErrorBoundary>
            )
          case 'gigs':
            return (
              <SectionErrorBoundary key="gigs" sectionName="Events">
                {divider}
                <GigsSection
                  upcoming={upcoming}
                  past={past}
                  artistName={String(heroConfig.headline ?? 'ZARDONIC')}
                />
              </SectionErrorBoundary>
            )
          case 'newsletter':
            return (
              <SectionErrorBoundary key="newsletter" sectionName="Newsletter">
                {divider}
                <NewsletterSection
                  heading={String(newsletterConfig.heading ?? 'Mailing List')}
                  body={String(newsletterConfig.body ?? 'Subscribe to get the latest news and releases.')}
                  privacyPolicyUrl={privacyPolicyUrl}
                />
              </SectionErrorBoundary>
            )
          case 'contact':
            return (
              <SectionErrorBoundary key="contact" sectionName="Contact">
                {divider}
                <ContactSection />
              </SectionErrorBoundary>
            )
          default:
            return null
        }
      })}

      {/* Fallback: if sections config is empty or contact not included */}
      {!isSectionVisible('contact') && (
        <SectionErrorBoundary sectionName="Contact">
          <SectionDivider />
          <ContactSection />
        </SectionErrorBoundary>
      )}
    </PageLayout>
  )
}
