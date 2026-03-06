import Hero from './Hero'
import Navigation from './Navigation'
import Card from './Card'
import BackgroundEffects from './BackgroundEffects'
import SectionDivider from './SectionDivider'
import LoadingScreen from './LoadingScreen'
import './styles.css'

export const zardonicTheme = {
  id: 'zardonic-theme',
  name: 'Zardonic Cyberpunk Theme',
  colors: {
    primary: 'oklch(0.45 0.22 25)',
    accent: 'oklch(0.55 0.25 25)',
    background: 'oklch(0.1 0 0)',
    foreground: 'oklch(0.95 0 0)',
    card: 'oklch(0.15 0 0)',
    border: 'oklch(0.25 0 0)',
    muted: 'oklch(0.25 0 0)',
    'muted-foreground': 'oklch(0.6 0 0)',
  },
  fonts: {
    heading: "'Orbitron', sans-serif",
    body: "'Share Tech Mono', monospace",
    mono: "'Share Tech Mono', monospace",
  },
  slots: {
    Hero,
    Navigation,
    Card,
    BackgroundEffects,
    SectionDivider,
    LoadingScreen,
  }
}

export type ZardonicTheme = typeof zardonicTheme
