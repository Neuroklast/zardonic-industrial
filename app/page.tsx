import type { ReactNode } from 'react'
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
import { DraftSectionShell } from './_components/public/DraftSectionShell'
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
import { resolveHeroLogoUrl } from '@/lib/hero-defaults'
import { buildNavLinks } from '@/lib/nav-links'
import {
  parseSections,
  withoutExcludedSections,
  type SectionConfig,
} from '@/lib/site-config-sections'

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





// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ adminPreview?: string }>
}) {
  const { adminPreview } = await searchParams
  const isAdminPreview = adminPreview === '1'
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
  const allSections = withoutExcludedSections(
    parseSections(sectionsRaw).sort((a, b) => a.order - b.order),
  )
  const sections = isAdminPreview
    ? allSections
    : allSections.filter((s) => s.visible)

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

  const bgMobileVideoPath =
    typeof bgConfig.video_mobile_storage_path === 'string' ? bgConfig.video_mobile_storage_path : null
  const bgMobileVideoFallback =
    typeof bgConfig.video_mobile_url === 'string' ? bgConfig.video_mobile_url : null
  const backgroundMobileVideoUrl = resolveImageUrl(bgMobileVideoPath, bgMobileVideoFallback)

  const mobileVideoMode =
    bgConfig.mobileVideoMode === 'separate' || bgConfig.mobileVideoMode === 'off'
      ? bgConfig.mobileVideoMode
      : 'same'

  const backgroundVideoOpacity =
    typeof bgConfig.backgroundVideoOpacity === 'number'
      ? bgConfig.backgroundVideoOpacity
      : undefined

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
    sectionPanelOpacity:
      typeof appearanceConfig.sectionPanelOpacity === 'number'
        ? appearanceConfig.sectionPanelOpacity
        : undefined,
    sectionGridOpacity:
      typeof appearanceConfig.sectionGridOpacity === 'number'
        ? appearanceConfig.sectionGridOpacity
        : undefined,
    cardSurfaceOpacity:
      typeof appearanceConfig.cardSurfaceOpacity === 'number'
        ? appearanceConfig.cardSurfaceOpacity
        : undefined,
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

  // Helper: is a section visible in the saved site config?
  function isSectionVisible(id: string) {
    return allSections.some((s) => s.id === id && s.visible)
  }

  function wrapForPreview(content: ReactNode, section: SectionConfig) {
    if (!isAdminPreview) return content
    return (
      <DraftSectionShell
        key={section.id}
        sectionId={section.id}
        order={section.order}
        visible={section.visible}
      >
        {content}
      </DraftSectionShell>
    )
  }

  // Build slots for the mandatory PageLayout (AGENTS §6)
  const backgroundLayers = (
    <BackgroundStack
      imageUrl={backgroundUrl}
      videoUrl={backgroundVideoUrl ?? undefined}
      mobileVideoUrl={backgroundMobileVideoUrl ?? undefined}
      mobileVideoMode={mobileVideoMode}
      backgroundType={backgroundType}
      imageOpacity={backgroundOpacity}
      videoOpacity={backgroundVideoOpacity}
    />
  )

  const globalEffectsSlot = (
    <GlobalEffects crtEnabled={crtEnabled} scanlineEnabled={scanlineEnabled} noiseEnabled={noiseEnabled} />
  )

  const navLinks = buildNavLinks(allSections.filter((section) => section.visible))
  const navSlot = <SiteNav links={navLinks} />

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
            return wrapForPreview(
              <SectionErrorBoundary key="hero" sectionName="Hero">
                <HeroSection
                  headline={String(heroConfig.headline ?? 'ZARDONIC')}
                  logoImageUrl={resolveHeroLogoUrl(
                    typeof heroConfig.logoImageStoragePath === 'string' ? heroConfig.logoImageStoragePath : null,
                    typeof heroConfig.logoImageUrl === 'string' ? heroConfig.logoImageUrl : null,
                    resolveImageUrl,
                  )}
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
              </SectionErrorBoundary>,
              section,
            )
          case 'bio':
            return wrapForPreview(
              <SectionErrorBoundary key="bio" sectionName="Bio">
                {divider}
                <BioSection
                  content={bio}
                  heading={section.label}
                  intro={section.intro}
                  bodyFontSize={typeof bioOverrides.bodyFontSize === 'string' ? bioOverrides.bodyFontSize : undefined}
                  readMoreMaxHeight={typeof bioOverrides.readMoreMaxHeight === 'string' ? bioOverrides.readMoreMaxHeight : undefined}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'credits':
            return wrapForPreview(
              <SectionErrorBoundary key="credits" sectionName="Credits">
                {divider}
                <CreditsSection
                  credits={credits}
                  endorsements={endorsements}
                  partners={partnerFriends}
                  heading={section.label}
                  intro={section.intro}
                  logoBrightness={typeof creditOverrides.logoBrightness === 'number' ? creditOverrides.logoBrightness : undefined}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'gallery':
            return wrapForPreview(
              <SectionErrorBoundary key="gallery" sectionName="Gallery">
                {divider}
                <GallerySection
                  items={gallery.map(galleryItemMap)}
                  heading={section.label}
                  intro={section.intro}
                  columns={typeof galleryOverrides.columns === 'string' ? galleryOverrides.columns : '3'}
                  maxVisible={typeof galleryOverrides.maxVisible === 'number' ? galleryOverrides.maxVisible : undefined}
                  aspectRatio={typeof galleryOverrides.aspectRatio === 'string' ? galleryOverrides.aspectRatio : undefined}
                  gap={typeof galleryOverrides.gap === 'string' ? galleryOverrides.gap : undefined}
                  lightbox={galleryOverrides.lightbox !== false}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'music-highlights':
            return wrapForPreview(
              <SectionErrorBoundary key="music-highlights" sectionName="Music Highlights">
                {divider}
                <MusicHighlightsSection
                  highlights={musicHighlights}
                  heading={section.label}
                  intro={section.intro}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'releases':
            return wrapForPreview(
              <SectionErrorBoundary key="releases" sectionName="Releases">
                {divider}
                <PublicPageClient
                  releases={releaseItems}
                  artistName={String(heroConfig.headline ?? 'ZARDONIC')}
                  heading={section.label}
                  intro={section.intro}
                  releaseLayout={typeof releaseOverrides.releaseLayout === 'string' && ['grid', 'swipe', 'carousel-3d'].includes(releaseOverrides.releaseLayout) ? (releaseOverrides.releaseLayout as 'grid' | 'swipe' | 'carousel-3d') : 'grid'}
                  releaseColumns={typeof releaseOverrides.releaseColumns === 'string' ? releaseOverrides.releaseColumns : '4'}
                  releaseCardVariant={typeof releaseOverrides.releaseCardVariant === 'string' ? releaseOverrides.releaseCardVariant : undefined}
                  releaseHoverEffect={typeof releaseOverrides.releaseHoverEffect === 'string' ? releaseOverrides.releaseHoverEffect : undefined}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'social':
            return social.length > 0
              ? wrapForPreview(
                  <SectionErrorBoundary key="social" sectionName="Social">
                    {divider}
                    <SocialSection links={social} label={section.label} />
                  </SectionErrorBoundary>,
                  section,
                )
              : null
          case 'merchandise':
            return wrapForPreview(
              <SectionErrorBoundary key="merchandise" sectionName="Merchandise">
                {divider}
                <MerchandiseSection
                  items={merch.map(commerceItemMap)}
                  heading={section.label}
                  intro={section.intro}
                  footerText={String(merchandiseConfig.footerText ?? '')}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'soundpacks':
            return wrapForPreview(
              <SectionErrorBoundary key="soundpacks" sectionName="Soundpacks">
                {divider}
                <SoundpacksSection
                  items={soundpacks.map(commerceItemMap)}
                  heading={section.label}
                  intro={section.intro}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'gigs':
            return wrapForPreview(
              <SectionErrorBoundary key="gigs" sectionName="Events">
                {divider}
                <GigsSection
                  upcoming={upcoming}
                  past={past}
                  artistName={String(heroConfig.headline ?? 'ZARDONIC')}
                  heading={section.label}
                  intro={section.intro}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'newsletter':
            return wrapForPreview(
              <SectionErrorBoundary key="newsletter" sectionName="Newsletter">
                {divider}
                <NewsletterSection
                  heading={section.label}
                  intro={section.intro}
                  body={String(newsletterConfig.body ?? 'Subscribe to get the latest news and releases.')}
                  privacyPolicyUrl={privacyPolicyUrl}
                />
              </SectionErrorBoundary>,
              section,
            )
          case 'contact':
            return wrapForPreview(
              <SectionErrorBoundary key="contact" sectionName="Contact">
                {divider}
                <ContactSection heading={section.label} intro={section.intro} />
              </SectionErrorBoundary>,
              section,
            )
          default:
            return null
        }
      })}

      {/* Fallback: if sections config is empty or contact not included */}
      {!isAdminPreview && !isSectionVisible('contact') && (
        <SectionErrorBoundary sectionName="Contact">
          <SectionDivider />
          <ContactSection heading="Contact" />
        </SectionErrorBoundary>
      )}
    </PageLayout>
  )
}
