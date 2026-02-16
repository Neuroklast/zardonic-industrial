export interface SectionVisibility {
  bio?: boolean
  music?: boolean
  gigs?: boolean
  releases?: boolean
  gallery?: boolean
  connect?: boolean
  creditHighlights?: boolean
}

export interface ThemeCustomization {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  foregroundColor?: string
  fontHeading?: string
  fontBody?: string
  fontMono?: string
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
}
