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
  id: string; title: string
  storage_path: string | null; image_url: string | null
}
interface SocialRow { id: string; platform: string; url: string; label: string | null }

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
      supabase.from('gigs').select('id, title, venue, city, country, event_date, ticket_url, festival_name').order('event_date', { ascending: true }),
      supabase.from('releases').select('id, title, type, release_date, cover_storage_path, cover_url, streaming_links').order('display_order', { ascending: true }),
      supabase.from('partners').select('id, name, url, logo_storage_path, logo_url, category').order('display_order', { ascending: true }),
      supabase.from('music_highlights').select('id, title, youtube_url, description').order('display_order', { ascending: true }),
      supabase.from('merchandise').select('id, title, image_storage_path, image_url, external_url').order('display_order', { ascending: true }),
      supabase.from('soundpacks').select('id, title, image_storage_path, image_url, external_url').order('display_order', { ascending: true }),
      supabase.from('gallery').select('id, title, storage_path, image_url').order('display_order', { ascending: true }),
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
    title: row.title,
    imageUrl: resolveImageUrl(row.storage_path, row.image_url),
  })

  // Gigs: split upcoming vs past
  const now = new Date()
  const upcoming = gigs.filter((g) => new Date(g.event_date) >= now)
  const past = gigs.filter((g) => new Date(g.event_date) < now).reverse()

  return (
    <div className="min-h-screen text-white">
      <GlobalEffects />
      <BackgroundStack
        imageUrl={backgroundUrl}
        videoUrl={backgroundVideoUrl ?? undefined}
        backgroundType={backgroundType}
        imageOpacity={backgroundOpacity}
      />

      {/* Fixed navigation */}
      <SiteNav />

      {/* Main content – all sections stack above the background */}
      <main>
        {/* Hero */}
        <HeroSection
          headline={String(heroConfig.headline ?? 'ZARDONIC')}
          tagline={String(heroConfig.tagline ?? '')}
          ctaLabel={String(heroConfig.ctaLabel ?? 'LISTEN NOW')}
          ctaUrl={String(heroConfig.ctaUrl ?? '#releases')}
          backgroundImageUrl={typeof heroConfig.backgroundImageUrl === 'string' ? heroConfig.backgroundImageUrl : backgroundUrl}
          backgroundImageOpacity={typeof heroConfig.backgroundImageOpacity === 'number' ? heroConfig.backgroundImageOpacity : 0.35}
        />

        <SectionDivider />
        <BioSection content={bio} />

        <SectionDivider />
        <CreditsSection credits={credits} endorsements={endorsements} />

        <SectionDivider />
        <GallerySection items={gallery.map(galleryItemMap)} />

        <SectionDivider />
        <MusicHighlightsSection highlights={musicHighlights} />

        <SectionDivider />
        <ReleasesSection releases={releaseItems} />

        {merch.length > 0 && (
          <>
            <SectionDivider />
            <MerchandiseSection
              items={merch.map(commerceItemMap)}
              footerText={String(merchandiseConfig.footerText ?? '')}
            />
          </>
        )}

        {soundpacks.length > 0 && (
          <>
            <SectionDivider />
            <SoundpacksSection items={soundpacks.map(commerceItemMap)} />
          </>
        )}

        <SectionDivider />
        <GigsSection upcoming={upcoming} past={past} />

        <SectionDivider />
        <NewsletterSection
          heading={String(newsletterConfig.heading ?? 'Mailing List')}
          body={String(newsletterConfig.body ?? 'Subscribe to get the latest news and releases.')}
        />

        <SectionDivider />
        <ContactSection />
      </main>

      <SiteFooter
        socialLinks={social}
        impressumUrl={String(footerConfig.impressumUrl ?? '/impressum')}
        privacyUrl={String(footerConfig.privacyUrl ?? '/privacy')}
      />
    </div>
  )
}
