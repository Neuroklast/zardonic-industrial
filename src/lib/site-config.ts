import type { SiteConfig, SocialLinks, Gig, Release, Biography, TerminalCommand, Impressum, GalleryImage, Datenschutz, FontSizeSettings, SoundSettings, HudTexts, SectionLabels, NewsItem, MediaFile, ThemeSettings, SectionVisibility, NewsletterSettings, ContactSettings, AnimationSettings, SectionConfig, FontConfig, WidgetPlugin } from './types'

export const TEMPLATE_VERSION = '2.0.0'

export const DEFAULT_SECTION_ORDER = [
  'news', 'biography', 'gallery', 'gigs', 'releases', 'media', 'social', 'partners', 'contact'
]

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteId: '',
  siteType: 'band',
  siteName: '',
  setupComplete: false,
  templateVersion: TEMPLATE_VERSION,
  genres: [],
  socialLinks: {},
  gigs: [],
  releases: [],
  sectionOrder: DEFAULT_SECTION_ORDER,
  navigation: { showLanguageSwitcher: true, showAudioPlayer: true },
  footer: { copyrightText: '© {year} {siteName}', showAttribution: true },
  seo: {},
  features: {
    newsletter: false,
    contactForm: true,
    gallery: true,
    terminal: true,
    sounds: true,
    crtEffects: true,
    hudBackground: true,
    cookieBanner: true,
    security: true,
  },
}

export function generateSiteId(): string {
  return crypto.randomUUID?.() ?? `site-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createSiteConfig(partial: Partial<SiteConfig>): SiteConfig {
  return {
    ...DEFAULT_SITE_CONFIG,
    ...partial,
    siteId: partial.siteId || generateSiteId(),
    templateVersion: TEMPLATE_VERSION,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    navigation: { ...DEFAULT_SITE_CONFIG.navigation, ...partial.navigation },
    footer: { ...DEFAULT_SITE_CONFIG.footer, ...partial.footer },
    seo: { ...DEFAULT_SITE_CONFIG.seo, ...partial.seo },
    features: { ...DEFAULT_SITE_CONFIG.features, ...partial.features },
    ...(partial.sections !== undefined ? { sections: partial.sections } : {}),
    ...(partial.fontConfig !== undefined ? { fontConfig: partial.fontConfig } : {}),
    ...(partial.widgetPlugins !== undefined ? { widgetPlugins: partial.widgetPlugins } : {}),
  }
}

export function migrateFromLegacyBandData(legacy: Record<string, unknown>): SiteConfig {
  return createSiteConfig({
    siteName: (legacy.name as string) || '',
    setupComplete: true,
    genres: (legacy.genres as string[]) || [],
    socialLinks: (legacy.socialLinks as SocialLinks) || {},
    gigs: (legacy.gigs as Gig[]) || [],
    releases: (legacy.releases as Release[]) || [],
    biography: legacy.biography as Biography | undefined,
    label: legacy.label as string | undefined,
    logoUrl: legacy.logoUrl as string | undefined,
    titleImageUrl: legacy.titleImageUrl as string | undefined,
    terminalCommands: legacy.terminalCommands as TerminalCommand[] | undefined,
    impressum: legacy.impressum as Impressum | undefined,
    galleryImages: legacy.galleryImages as GalleryImage[] | undefined,
    datenschutz: legacy.datenschutz as Datenschutz | undefined,
    fontSizes: legacy.fontSizes as FontSizeSettings | undefined,
    syncUrl: legacy.syncUrl as string | undefined,
    galleryDriveFolderUrl: legacy.galleryDriveFolderUrl as string | undefined,
    soundSettings: legacy.soundSettings as SoundSettings | undefined,
    configOverrides: legacy.configOverrides as Record<string, unknown> | undefined,
    secretCode: legacy.secretCode as string[] | undefined,
    hudTexts: legacy.hudTexts as HudTexts | undefined,
    sectionLabels: legacy.sectionLabels as SectionLabels | undefined,
    news: legacy.news as NewsItem[] | undefined,
    mediaFiles: legacy.mediaFiles as MediaFile[] | undefined,
    themeSettings: legacy.themeSettings as ThemeSettings | undefined,
    sectionVisibility: legacy.sectionVisibility as SectionVisibility | undefined,
    newsletterSettings: legacy.newsletterSettings as NewsletterSettings | undefined,
    contactSettings: legacy.contactSettings as ContactSettings | undefined,
    terminalMorseCode: legacy.terminalMorseCode as string | undefined,
    animations: legacy.animations as AnimationSettings | undefined,
    sections: legacy.sections as SectionConfig[] | undefined,
    fontConfig: legacy.fontConfig as FontConfig | undefined,
    widgetPlugins: legacy.widgetPlugins as WidgetPlugin[] | undefined,
  })
}
