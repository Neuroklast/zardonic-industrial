'use client'

import { m } from 'framer-motion'
import {
  InstagramLogo,
  FacebookLogo,
  SpotifyLogo,
  YoutubeLogo,
  SoundcloudLogo,
  TiktokLogo,
  Link as LinkIcon,
  MusicNote,
} from '@phosphor-icons/react/dist/ssr'

interface SocialLink {
  id: string
  platform: string
  url: string
  label: string | null
}

interface SocialSectionProps {
  links: SocialLink[]
  label?: string
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  spotify: SpotifyLogo,
  youtube: YoutubeLogo,
  soundcloud: SoundcloudLogo,
  tiktok: TiktokLogo,
  bandcamp: MusicNote,
  applemusic: MusicNote,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  spotify: '#1DB954',
  youtube: '#FF0000',
  soundcloud: '#FF5500',
  tiktok: '#000000',
  bandcamp: '#1da0c3',
  applemusic: '#FC3C44',
}

function platformKey(platform: string) {
  return platform.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function SocialButton({ link }: { link: SocialLink }) {
  const key = platformKey(link.platform)
  const Icon = PLATFORM_ICONS[key] ?? LinkIcon
  const color = PLATFORM_COLORS[key] ?? 'var(--color-primary)'
  const displayLabel = link.label ?? link.platform

  return (
    <m.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${displayLabel} – opens in new tab`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="surface-card flex items-center gap-3 border border-primary/30 hover:border-primary/60 hover:bg-primary/5 px-5 py-3 font-mono text-sm uppercase tracking-wider transition-all"
      style={{ '--icon-color': color } as React.CSSProperties}
    >
      <Icon size={20} weight="bold" style={{ color }} aria-hidden="true" />
      <span className="text-foreground/80">{displayLabel}</span>
    </m.a>
  )
}

export function SocialSection({ links, label = 'CONNECT' }: SocialSectionProps) {
  if (links.length === 0) return null

  return (
    <section
      id="connect"
      className="relative max-w-6xl mx-auto px-card py-section scanline-effect"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="primary accent card border"
    >
      <m.div
        initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="cyber-grid surface-section-panel border border-border/60 p-6 md:p-8"
      >
        <div className="mb-12">
          <h2
            className="hover-chromatic hover-glitch cyber2077-scan-build font-mono text-4xl font-bold uppercase tracking-tighter text-foreground md:text-6xl"
            data-text={label}
          >
            {label}
            <span className="animate-pulse">_</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {links.map((link) => (
            <SocialButton key={link.id} link={link} />
          ))}
        </div>
      </m.div>
    </section>
  )
}
