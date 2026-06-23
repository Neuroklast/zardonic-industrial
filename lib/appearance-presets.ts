export interface AppearanceTheme {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  cardColor?: string
  foregroundColor?: string
  mutedForegroundColor?: string
  borderColor?: string
  secondaryColor?: string
  fontHeading?: string
  fontBody?: string
  fontMono?: string
  headingFontSize?: string
  bodyFontSize?: string
  monoFontSize?: string
}

export interface SavedAppearancePreset {
  name: string
  theme: AppearanceTheme
}

export const BUILTIN_APPEARANCE_PRESETS: SavedAppearancePreset[] = [
  {
    name: 'Neon Red (Default)',
    theme: {
      primaryColor: 'oklch(0.50 0.22 25)',
      accentColor: 'oklch(0.60 0.24 25)',
      backgroundColor: 'oklch(0 0 0)',
      cardColor: 'oklch(0.05 0 0)',
      foregroundColor: 'oklch(1 0 0)',
      mutedForegroundColor: 'oklch(0.55 0 0)',
      borderColor: 'oklch(0.15 0 0)',
      secondaryColor: 'oklch(0.10 0 0)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
  {
    name: 'Cyber Blue',
    theme: {
      primaryColor: 'oklch(0.55 0.20 250)',
      accentColor: 'oklch(0.65 0.22 250)',
      backgroundColor: 'oklch(0.02 0.01 260)',
      cardColor: 'oklch(0.06 0.01 260)',
      foregroundColor: 'oklch(0.95 0.01 250)',
      mutedForegroundColor: 'oklch(0.55 0.05 250)',
      borderColor: 'oklch(0.15 0.03 250)',
      secondaryColor: 'oklch(0.10 0.02 260)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
  {
    name: 'Toxic Green',
    theme: {
      primaryColor: 'oklch(0.60 0.22 145)',
      accentColor: 'oklch(0.70 0.24 145)',
      backgroundColor: 'oklch(0.01 0 0)',
      cardColor: 'oklch(0.04 0.01 145)',
      foregroundColor: 'oklch(0.90 0.10 145)',
      mutedForegroundColor: 'oklch(0.50 0.08 145)',
      borderColor: 'oklch(0.12 0.04 145)',
      secondaryColor: 'oklch(0.08 0.02 145)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
  {
    name: 'Violet Chrome',
    theme: {
      primaryColor: 'oklch(0.55 0.25 300)',
      accentColor: 'oklch(0.65 0.27 310)',
      backgroundColor: 'oklch(0.02 0.02 290)',
      cardColor: 'oklch(0.06 0.03 290)',
      foregroundColor: 'oklch(0.95 0.02 300)',
      mutedForegroundColor: 'oklch(0.55 0.06 300)',
      borderColor: 'oklch(0.15 0.05 300)',
      secondaryColor: 'oklch(0.10 0.04 300)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
  {
    name: 'Gold Circuit',
    theme: {
      primaryColor: 'oklch(0.65 0.18 80)',
      accentColor: 'oklch(0.72 0.20 80)',
      backgroundColor: 'oklch(0.03 0.01 60)',
      cardColor: 'oklch(0.07 0.02 60)',
      foregroundColor: 'oklch(0.92 0.05 80)',
      mutedForegroundColor: 'oklch(0.55 0.04 60)',
      borderColor: 'oklch(0.18 0.06 80)',
      secondaryColor: 'oklch(0.10 0.03 60)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
  {
    name: 'DIGICIDE',
    theme: {
      primaryColor: 'oklch(0.78 0.03 220)',
      accentColor: 'oklch(0.65 0.06 215)',
      backgroundColor: 'oklch(0.015 0.005 240)',
      cardColor: 'oklch(0.045 0.008 230)',
      foregroundColor: 'oklch(0.82 0.03 210)',
      mutedForegroundColor: 'oklch(0.40 0.02 220)',
      borderColor: 'oklch(0.10 0.01 225)',
      secondaryColor: 'oklch(0.07 0.01 230)',
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      fontMono: "'Share Tech Mono', monospace",
    },
  },
]

export const HEADING_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Orbitron', value: "'Orbitron', sans-serif" },
  { label: 'Rajdhani', value: "'Rajdhani', sans-serif" },
  { label: 'Exo 2', value: "'Exo 2', sans-serif" },
  { label: 'Audiowide', value: "'Audiowide', sans-serif" },
  { label: 'Share Tech', value: "'Share Tech', sans-serif" },
  { label: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'system-ui', value: 'system-ui, sans-serif' },
]

export const BODY_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'system-ui', value: 'system-ui, sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Share Tech Mono', value: "'Share Tech Mono', monospace" },
  { label: 'Rajdhani', value: "'Rajdhani', sans-serif" },
]

export const MONO_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Share Tech Mono', value: "'Share Tech Mono', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'VT323', value: "'VT323', monospace" },
]