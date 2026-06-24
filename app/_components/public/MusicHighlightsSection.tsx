/**
 * MusicHighlightsSection
 * Shows YouTube videos with a two-click consent pattern (GDPR):
 * - First state: thumbnail + play button (no iframe, no YouTube cookies)
 * - After click: YouTube embed loads in place
 */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SectionWrapper, SectionEmpty, SectionHeading } from './SectionWrapper'

interface MusicHighlight {
  id: string
  title: string
  youtube_url: string
  description: string | null
}

interface EmbedPlayerProps {
  title: string
  youtubeUrl: string
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

function EmbedPlayer({ title, youtubeUrl }: EmbedPlayerProps) {
  const [consented, setConsented] = useState(false)
  const videoId = extractVideoId(youtubeUrl)

  if (!videoId) {
    return (
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center font-mono text-xs text-muted-foreground underline transition-colors hover:text-foreground"
      >
        Watch on YouTube →
      </a>
    )
  }

  if (!consented) {
    return (
      <button
        type="button"
        onClick={() => setConsented(true)}
        className="group relative aspect-video w-full overflow-hidden border border-border bg-muted transition-colors hover:border-primary/40"
        aria-label={`Play ${title} on YouTube`}
      >
        <Image
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          fill
          className="object-cover opacity-50 transition-opacity group-hover:opacity-60"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground/60 transition-colors group-hover:border-foreground">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5 text-foreground">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            Click to load YouTube
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
      />
    </div>
  )
}

interface MusicHighlightsSectionProps {
  highlights: MusicHighlight[]
}

export function MusicHighlightsSection({ highlights }: MusicHighlightsSectionProps) {
  return (
    <SectionWrapper id="music" data-theme-color="foreground card border primary">
      <SectionHeading dataText="MUSIC HIGHLIGHTS">MUSIC HIGHLIGHTS</SectionHeading>
      {highlights.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {highlights.map((h) => (
            <div key={h.id} className="flex flex-col gap-3">
              <EmbedPlayer title={h.title} youtubeUrl={h.youtube_url} />
              <p className="font-mono text-sm text-foreground">{h.title}</p>
              {h.description ? (
                <p className="font-mono text-xs text-muted-foreground">{h.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <SectionEmpty label="Music highlights coming soon" />
      )}
    </SectionWrapper>
  )
}