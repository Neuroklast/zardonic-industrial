import { createElement, useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hexToOklch as baseHexToOklch, oklchToHex as baseOklchToHex } from '@/lib/color-utils'
import { loadGoogleFont } from '@/lib/font-loader'
import type { OverlayEffect, ThemeSettings } from '@/lib/types'

export interface ThemePreset {
  name: string
  description: string
  theme: ThemeSettings
}

export interface FontOption {
  label: string
  value: string
  google: boolean
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Neon Red (Default)',
    description: 'Default Neuroklast red cyberpunk theme',
    theme: {
      primary: 'oklch(0.50 0.22 25)',
      accent: 'oklch(0.60 0.24 25)',
      background: 'oklch(0 0 0)',
      card: 'oklch(0.05 0 0)',
      foreground: 'oklch(1 0 0)',
      mutedForeground: 'oklch(0.55 0 0)',
      border: 'oklch(0.15 0 0)',
      secondary: 'oklch(0.10 0 0)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
  {
    name: 'Cyber Blue',
    description: 'Cool blue neon – Night City vibes',
    theme: {
      primary: 'oklch(0.55 0.20 250)',
      accent: 'oklch(0.65 0.22 250)',
      background: 'oklch(0.02 0.01 260)',
      card: 'oklch(0.06 0.01 260)',
      foreground: 'oklch(0.95 0.01 250)',
      mutedForeground: 'oklch(0.55 0.05 250)',
      border: 'oklch(0.15 0.03 250)',
      secondary: 'oklch(0.10 0.02 260)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
  {
    name: 'Toxic Green',
    description: 'Matrix / hacker green terminal theme',
    theme: {
      primary: 'oklch(0.60 0.22 145)',
      accent: 'oklch(0.70 0.24 145)',
      background: 'oklch(0.01 0 0)',
      card: 'oklch(0.04 0.01 145)',
      foreground: 'oklch(0.90 0.10 145)',
      mutedForeground: 'oklch(0.50 0.08 145)',
      border: 'oklch(0.12 0.04 145)',
      secondary: 'oklch(0.08 0.02 145)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'JetBrains Mono', monospace",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
  {
    name: 'Violet Chrome',
    description: 'Deep purple & chrome – synthwave aesthetic',
    theme: {
      primary: 'oklch(0.55 0.25 300)',
      accent: 'oklch(0.65 0.27 310)',
      background: 'oklch(0.02 0.02 290)',
      card: 'oklch(0.06 0.03 290)',
      foreground: 'oklch(0.95 0.02 300)',
      mutedForeground: 'oklch(0.55 0.06 300)',
      border: 'oklch(0.15 0.05 300)',
      secondary: 'oklch(0.10 0.04 300)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
  {
    name: 'Gold Circuit',
    description: 'Gold & dark – luxury tech aesthetic',
    theme: {
      primary: 'oklch(0.65 0.18 80)',
      accent: 'oklch(0.72 0.20 80)',
      background: 'oklch(0.03 0.01 60)',
      card: 'oklch(0.07 0.02 60)',
      foreground: 'oklch(0.92 0.05 80)',
      mutedForeground: 'oklch(0.55 0.04 60)',
      border: 'oklch(0.18 0.06 80)',
      secondary: 'oklch(0.10 0.03 60)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
  {
    name: 'Crimson Punk',
    description: 'Deep crimson & hot pink – aggressive cyberpunk',
    theme: {
      primary: 'oklch(0.55 0.24 10)',
      accent: 'oklch(0.62 0.26 350)',
      background: 'oklch(0.02 0.01 350)',
      card: 'oklch(0.06 0.02 350)',
      foreground: 'oklch(0.95 0.02 10)',
      mutedForeground: 'oklch(0.50 0.06 350)',
      border: 'oklch(0.15 0.04 350)',
      secondary: 'oklch(0.10 0.03 350)',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  },
]

export const FONT_OPTIONS: FontOption[] = [
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", google: false },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif", google: false },
  { label: 'System Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', google: false },
  { label: 'System Sans', value: 'ui-sans-serif, system-ui, sans-serif', google: false },
  { label: 'System Serif', value: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif", google: false },
  { label: 'Orbitron', value: "'Orbitron', sans-serif", google: true },
  { label: 'Share Tech Mono', value: "'Share Tech Mono', monospace", google: true },
  { label: 'VT323', value: "'VT323', monospace", google: true },
  { label: 'Press Start 2P', value: "'Press Start 2P', monospace", google: true },
  { label: 'Audiowide', value: "'Audiowide', sans-serif", google: true },
  { label: 'Rajdhani', value: "'Rajdhani', sans-serif", google: true },
  { label: 'Chakra Petch', value: "'Chakra Petch', sans-serif", google: true },
  { label: 'Exo 2', value: "'Exo 2', sans-serif", google: true },
  { label: 'Tektur', value: "'Tektur', sans-serif", google: true },
  { label: 'Oxanium', value: "'Oxanium', sans-serif", google: true },
  { label: 'Iceland', value: "'Iceland', monospace", google: true },
  { label: 'Michroma', value: "'Michroma', sans-serif", google: true },
  { label: 'Russo One', value: "'Russo One', sans-serif", google: true },
  { label: 'Bruno Ace', value: "'Bruno Ace', sans-serif", google: true },
  { label: 'Electrolize', value: "'Electrolize', sans-serif", google: true },
]

export const DEFAULT_OVERLAY: OverlayEffect = { enabled: false, intensity: 0.5 }

export const OVERLAY_LABELS: Record<string, { name: string; description: string }> = {
  dotMatrix: { name: 'Dot Matrix', description: 'Retro dot-grid pattern overlay' },
  scanlines: { name: 'Scanlines', description: 'Horizontal CRT scanline bars' },
  crt: { name: 'CRT Curvature', description: 'Curved screen edge distortion' },
  noise: { name: 'Static Noise', description: 'Subtle random noise grain' },
  vignette: { name: 'Vignette', description: 'Dark edges / spotlight center' },
  chromatic: { name: 'Chromatic Aberration', description: 'RGB color fringe shift' },
  movingScanline: { name: 'Moving Scanline', description: 'CRT-Auffrischungslinie die sich bewegt' },
}

export const SECTION_LABELS: Partial<Record<string, string>> = {
  news: 'News Section',
  biography: 'Biography Section',
  gallery: 'Gallery Section',
  gigs: 'Gigs Section',
  releases: 'Releases Section',
  media: 'Media Section',
  social: 'Social / Connect Section',
  partnersAndFriends: 'Partners & Friends Section',
  hudBackground: 'HUD Background Overlay',
  audioVisualizer: 'Audio Visualizer',
  scanline: 'CRT Scanline Effect',
  systemMonitor: 'System Monitor HUD',
}

export function loadAllGoogleFonts() {
  FONT_OPTIONS.filter(font => font.google).forEach(font => loadGoogleFont(font.label))
}

export function applyThemeToDOM(theme: ThemeSettings | undefined) {
  const root = document.documentElement
  if (!theme) return

  if (theme.primary) root.style.setProperty('--primary', theme.primary)
  if (theme.accent) root.style.setProperty('--accent', theme.accent)
  if (theme.background) root.style.setProperty('--background', theme.background)
  if (theme.card) root.style.setProperty('--card', theme.card)
  if (theme.foreground) root.style.setProperty('--foreground', theme.foreground)
  if (theme.mutedForeground) root.style.setProperty('--muted-foreground', theme.mutedForeground)
  if (theme.border) root.style.setProperty('--border', theme.border)
  if (theme.secondary) root.style.setProperty('--secondary', theme.secondary)
  if (theme.fontBody) root.style.setProperty('--font-body', theme.fontBody)
  if (theme.fontMono) root.style.setProperty('--font-mono', theme.fontMono)
  if (theme.fontHeading) root.style.setProperty('--font-heading', theme.fontHeading)

  if (theme.borderRadius !== undefined) {
    root.style.setProperty('--radius', `${theme.borderRadius}rem`)
    root.style.setProperty('--radius-factor', String(theme.borderRadius / 0.125))
  }

  root.style.setProperty('--font-size-factor', String(theme.fontSize ?? 1))
  applyOverlayEffectsToDOM(theme)

  if (theme.primary) {
    root.style.setProperty('--ring', theme.primary)
    root.style.setProperty('--destructive', theme.primary)
  }
  if (theme.foreground) {
    root.style.setProperty('--primary-foreground', theme.foreground)
    root.style.setProperty('--secondary-foreground', theme.foreground)
    root.style.setProperty('--accent-foreground', theme.foreground)
    root.style.setProperty('--card-foreground', theme.foreground)
    root.style.setProperty('--popover-foreground', theme.foreground)
    root.style.setProperty('--destructive-foreground', theme.foreground)
  }
  if (theme.background) {
    root.style.setProperty('--popover', theme.background)
  }
  if (theme.mutedForeground) {
    root.style.setProperty('--muted', theme.mutedForeground)
  }

  for (const key of ['fontHeading', 'fontBody', 'fontMono'] as const) {
    const value = theme[key]
    if (!value) continue
    const match = FONT_OPTIONS.find(font => font.value === value)
    if (match?.google) loadGoogleFont(match.label)
  }
}

export function applyOverlayEffectsToDOM(theme: ThemeSettings | undefined) {
  const root = document.documentElement
  const effects = theme?.overlayEffects
  root.style.setProperty('--overlay-dot-matrix', effects?.dotMatrix?.enabled ? String(effects.dotMatrix.intensity) : '0')
  root.style.setProperty('--overlay-scanlines', effects?.scanlines?.enabled ? String(effects.scanlines.intensity) : '0')
  root.style.setProperty('--overlay-crt', effects?.crt?.enabled ? String(effects.crt.intensity) : '0')
  root.style.setProperty('--overlay-noise', effects?.noise?.enabled ? String(effects.noise.intensity) : '0')
  root.style.setProperty('--overlay-vignette', effects?.vignette?.enabled ? String(effects.vignette.intensity) : '0')
  root.style.setProperty('--overlay-chromatic', effects?.chromatic?.enabled ? String(effects.chromatic.intensity) : '0')
  root.style.setProperty('--overlay-moving-scanline', effects?.movingScanline?.enabled ? '1' : '0')
}

export function resetThemeDOM() {
  const root = document.documentElement
  const props = [
    '--primary', '--accent', '--background', '--card', '--foreground',
    '--muted-foreground', '--border', '--secondary', '--font-body', '--font-mono',
    '--font-heading', '--ring', '--destructive', '--primary-foreground',
    '--secondary-foreground', '--accent-foreground', '--card-foreground',
    '--popover-foreground', '--destructive-foreground', '--popover', '--muted',
    '--radius', '--radius-factor', '--font-size-factor',
    '--overlay-dot-matrix', '--overlay-scanlines', '--overlay-crt',
    '--overlay-noise', '--overlay-vignette', '--overlay-chromatic',
    '--overlay-moving-scanline',
  ]
  props.forEach(prop => root.style.removeProperty(prop))
}

export function oklchToHex(oklch: string): string {
  return baseOklchToHex(oklch)
}

export function hexToOklch(hex: string): string {
  return baseHexToOklch(hex)
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [localHex, setLocalHex] = useState(() => oklchToHex(value))

  useEffect(() => {
    setLocalHex(oklchToHex(value))
  }, [value])

  const commit = useCallback((hex: string) => {
    onChange(hexToOklch(hex))
  }, [onChange])

  return createElement(
    'div',
    { className: 'flex items-center gap-3 py-1.5' },
    createElement(Label, { className: 'w-36 flex-shrink-0 font-mono text-xs text-muted-foreground' }, label),
    createElement(
      'div',
      { className: 'flex flex-1 items-center gap-2' },
      createElement('input', {
        type: 'color',
        value: localHex,
        onInput: (event: FormEvent<HTMLInputElement>) => setLocalHex(event.currentTarget.value),
        onMouseUp: (event: ReactMouseEvent<HTMLInputElement>) => commit(event.currentTarget.value),
        onChange: (event: ChangeEvent<HTMLInputElement>) => commit(event.currentTarget.value),
        className: 'h-8 w-8 cursor-pointer rounded border border-primary/20 bg-transparent',
        'aria-label': label,
      }),
      createElement(Input, {
        value,
        onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value),
        className: 'h-8 flex-1 font-mono text-xs',
        placeholder: 'oklch(0.50 0.22 25)',
      })
    )
  )
}
