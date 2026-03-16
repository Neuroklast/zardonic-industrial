export interface SectionVisibility {
  bio?: boolean
  music?: boolean
  gigs?: boolean
  releases?: boolean
  gallery?: boolean
  connect?: boolean
  creditHighlights?: boolean
  shell?: boolean
  contact?: boolean
}

export interface ThemeCustomization {
  // Base colors
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  foregroundColor?: string
  borderColor?: string
  hoverColor?: string
  
  // Card colors
  cardColor?: string
  cardForegroundColor?: string
  
  // Popover colors
  popoverColor?: string
  popoverForegroundColor?: string
  
  // Primary foreground
  primaryForegroundColor?: string
  
  // Secondary colors
  secondaryColor?: string
  secondaryForegroundColor?: string
  
  // Muted colors
  mutedColor?: string
  mutedForegroundColor?: string
  
  // Accent foreground
  accentForegroundColor?: string
  
  // Destructive colors
  destructiveColor?: string
  destructiveForegroundColor?: string
  
  // Input and ring
  inputColor?: string
  ringColor?: string
  
  // Border radius
  borderRadius?: string
  
  // Fonts
  fontHeading?: string
  fontBody?: string
  fontMono?: string
  fontSizes?: Record<string, string>
}

export interface AnimationSettings {
  glitchEnabled?: boolean
  scanlineEnabled?: boolean
  chromaticEnabled?: boolean
  crtEnabled?: boolean
  noiseEnabled?: boolean
  circuitBackgroundEnabled?: boolean
  crtOverlayOpacity?: number
  crtVignetteOpacity?: number
}

export interface ProgressiveOverlayModes {
  progressiveReveal?: boolean
  dataStream?: boolean
  sectorAssembly?: boolean
  holographicMaterialization?: boolean
}

export interface SectionLabels {
  biography?: string
  musicPlayer?: string
  upcomingGigs?: string
  releases?: string
  gallery?: string
  connect?: string
  creditHighlights?: string
  media?: string
  tourDates?: string
  shell?: string
  contact?: string
  headingPrefix?: string
}

export interface ContactInfo {
  managementName?: string
  managementEmail?: string
  bookingEmail?: string
  pressEmail?: string
  formTitle?: string
  formNameLabel?: string
  formNamePlaceholder?: string
  formEmailLabel?: string
  formEmailPlaceholder?: string
  formSubjectLabel?: string
  formSubjectPlaceholder?: string
  formMessageLabel?: string
  formMessagePlaceholder?: string
  formButtonText?: string
}

export interface LegalContent {
  impressumCustom?: string
  privacyCustom?: string
}

export interface ShellMember {
  name?: string
  role?: string
  bio?: string
  photo?: string
  social?: Record<string, string>
}

export interface CustomSocialLink {
  id: string
  label: string
  url: string
  icon?: string
}

export interface TerminalCommand {
  name: string
  description: string
  output: string[]
}

export interface MediaFile {
  id: string
  name: string
  url: string
  folder?: string
  type?: 'audio' | 'youtube' | 'download'
  description?: string
}

export interface AdminSettings {
  sectionVisibility?: SectionVisibility
  theme?: ThemeCustomization
  animations?: AnimationSettings
  progressiveOverlayModes?: ProgressiveOverlayModes
  configOverrides?: Record<string, unknown>
  faviconUrl?: string
  sectionLabels?: SectionLabels
  terminalCommands?: TerminalCommand[]
  sectionOrder?: string[]
  contactInfo?: ContactInfo
  contactSettings?: ContactSettings
  legalContent?: LegalContent
  shellMember?: ShellMember
  shellMembers?: ShellMember[]
  customSocialLinks?: CustomSocialLink[]
  glitchTextSettings?: {
    enabled?: boolean
    intervalMs?: number
    durationMs?: number
  }
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  date: string
  read?: boolean
}

export interface ContactSettings {
  enabled?: boolean
  title?: string
  description?: string
  emailForwardTo?: string
  successMessage?: string
  showSection?: boolean
}

// ─── Site Config Types ───────────────────────────────────────────────────────

export type LicenseTier = 'free' | 'premium' | 'agency'

export type ThemeLicenseStatus = 'free' | 'preview' | 'locked' | 'licensed'

export interface SectionConfig {
  id: string
  enabled: boolean
  order: number
}

export interface MetaTagSet {
  title: string
  description: string
  canonical?: string
  favicon?: string
  themeColor?: string
  og: {
    title: string
    description: string
    type: string
    url?: string
    image?: string
    siteName?: string
  }
  twitter: {
    card: string
    title: string
    description: string
    image?: string
    site?: string
  }
  jsonLd?: string
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  spotify?: string
  soundcloud?: string
  youtube?: string
  bandcamp?: string
  twitter?: string
  tiktok?: string
  appleMusic?: string
  website?: string
  [key: string]: string | undefined
}

export interface NavigationConfig {
  showLanguageSwitcher?: boolean
  showAudioPlayer?: boolean
}

export interface FooterConfig {
  copyrightText?: string
  showAttribution?: boolean
}

export interface SeoConfig {
  title?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  twitterHandle?: string
}

export interface FeaturesConfig {
  newsletter?: boolean
  contactForm?: boolean
  gallery?: boolean
  terminal?: boolean
  sounds?: boolean
  crtEffects?: boolean
  hudBackground?: boolean
  cookieBanner?: boolean
  security?: boolean
}

export interface NewsletterSettings {
  enabled?: boolean
  title?: string
  description?: string
  provider?: string
}

export interface SoundSettings {
  enabled?: boolean
  volume?: number
  hoverSound?: boolean
  clickSound?: boolean
}

export interface HudTexts {
  topLeft?: string
  topRight?: string
  bottomLeft?: string
  bottomRight?: string
}

export interface FontSizeSettings {
  heading?: string
  body?: string
  small?: string
}

export interface GlitchTextSettings {
  enabled?: boolean
  intervalMs?: number
  durationMs?: number
}

export interface FontConfig {
  heading?: string
  body?: string
  mono?: string
}

export interface ThemeSettings {
  activePreset?: string
  primary?: string
  accent?: string
  background?: string
  card?: string
  foreground?: string
  mutedForeground?: string
  border?: string
  secondary?: string
  heroStyle?: string
  loadingScreenType?: string
  animationSettings?: AnimationSettings
  overlayEffects?: {
    scanlines?: { enabled?: boolean; intensity?: number }
    crt?: { enabled?: boolean; intensity?: number }
    noise?: { enabled?: boolean; intensity?: number }
    vignette?: { enabled?: boolean; intensity?: number }
    chromatic?: { enabled?: boolean; intensity?: number }
    dotMatrix?: { enabled?: boolean; intensity?: number }
  }
  customColorPresets?: Array<{ id: string; name: string; colors: Record<string, string> }>
}

export interface Gig {
  id: string
  date: string
  venue: string
  location: string
  ticketUrl?: string
  gigType?: 'concert' | 'dj'
  allDay?: boolean
  status?: 'confirmed' | 'cancelled' | 'soldout' | 'announced'
  eventLinks?: {
    facebook?: string
    instagram?: string
    residentAdvisor?: string
    other?: string
  }
  supportingArtists?: string[]
  notes?: string
}

export interface Release {
  id: string
  title: string
  releaseDate: string
  type?: 'album' | 'ep' | 'single' | 'remix'
  artworkUrl?: string
  description?: string
  tracks?: Array<{ title: string; duration?: string }>
  streamingLinks?: Record<string, string>
}

export interface Biography {
  text?: string
  shortBio?: string
  members?: Array<{ name: string; role: string; photo?: string }>
  achievements?: string[]
  collaborations?: string[]
  photos?: string[]
}

export interface GalleryImage {
  id: string
  url: string
  caption?: string
  order?: number
}

export interface NewsItem {
  id: string
  title: string
  content: string
  date: string
  imageUrl?: string
  link?: string
  pinned?: boolean
}

export interface Impressum {
  content?: string
  company?: string
  address?: string
  email?: string
  phone?: string
}

export interface Datenschutz {
  content?: string
  lastUpdated?: string
}

export interface WidgetPlugin {
  id: string
  name: string
  enabled: boolean
  category: 'events' | 'music' | 'video' | 'social' | 'analytics' | 'merch' | 'custom'
  config?: Record<string, unknown>
  position?: 'main' | 'sidebar' | 'footer' | 'hero-below'
}

export type AdminDialog =
  | 'theme'
  | 'security'
  | 'analytics'
  | 'band-info'
  | 'config'
  | 'terminal'
  | 'newsletter'
  | 'contact-inbox'
  | 'blocklist'
  | 'attacker-profile'
  | 'sound-settings'
  | 'impressum'
  | 'subscriber-list'
  | null

export interface SiteConfig {
  siteId: string
  siteType: 'band' | 'dj' | 'artist' | 'label'
  siteName: string
  setupComplete: boolean
  templateVersion: string
  description?: string
  tagline?: string
  label?: string
  logoUrl?: string
  titleImageUrl?: string
  domain?: string
  genres: string[]
  socialLinks: SocialLinks
  gigs: Gig[]
  releases: Release[]
  sectionOrder: string[]
  sections?: SectionConfig[]
  navigation: NavigationConfig
  footer: FooterConfig
  seo: SeoConfig
  features: FeaturesConfig
  biography?: Biography
  terminalCommands?: TerminalCommand[]
  impressum?: Impressum
  datenschutz?: Datenschutz
  galleryImages?: GalleryImage[]
  fontSizes?: FontSizeSettings
  syncUrl?: string
  galleryDriveFolderUrl?: string
  soundSettings?: SoundSettings
  configOverrides?: Record<string, unknown>
  secretCode?: string[]
  hudTexts?: HudTexts
  sectionLabels?: SectionLabels
  news?: NewsItem[]
  mediaFiles?: MediaFile[]
  themeSettings?: ThemeSettings
  sectionVisibility?: SectionVisibility
  newsletterSettings?: NewsletterSettings
  contactSettings?: ContactSettings
  terminalMorseCode?: string
  animations?: AnimationSettings
  fontConfig?: FontConfig
  widgetPlugins?: WidgetPlugin[]
  createdAt?: string
  updatedAt?: string
}

/** Shell member slot type: 'entity' for band members, 'engineer' for sound engineer */
export type ShellMemberSlotType = 'entity' | 'engineer'

/** Extended shell member with slot type */
export interface ShellMemberSlot extends ShellMember {
  slotType: ShellMemberSlotType
  slotIndex: number
}

/** Constants for member slots */
export const ENTITY_SLOT_COUNT = 7
export const ENGINEER_SLOT_COUNT = 1
export const TOTAL_MEMBER_SLOTS = ENTITY_SLOT_COUNT + ENGINEER_SLOT_COUNT
