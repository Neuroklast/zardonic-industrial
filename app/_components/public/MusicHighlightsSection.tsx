/**
 * MusicHighlightsSection
 * Shows YouTube videos with a two-click consent pattern (GDPR):
 * - First state: thumbnail + play button (no iframe, no YouTube cookies)
 * - After click: YouTube embed loads in place
 */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SectionWrapper, SectionEmpty } from './SectionWrapper'

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
        className="font-mono text-xs text-zinc-400 hover:text-white underline"
      >
        Watch on YouTube →
      </a>
    )
  }

  if (!consented) {
    return (
      <button
        onClick={() => setConsented(true)}
        className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group overflow-hidden"
        aria-label={`Play ${title} on YouTube`}
      >
        <Image
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          fill
          className="object-cover opacity-50 group-hover:opacity-60 transition-opacity"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full border border-white/60 flex items-center justify-center group-hover:border-white transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
            Click to load YouTube
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="relative w-full aspect-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
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
    <SectionWrapper id="music" heading="Music Highlights">
      {highlights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {highlights.map((h) => (
            <div key={h.id} className="flex flex-col gap-3">
              <EmbedPlayer title={h.title} youtubeUrl={h.youtube_url} />
              <p className="font-mono text-sm text-zinc-200">{h.title}</p>
              {h.description && (
                <p className="font-mono text-xs text-zinc-500">{h.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <SectionEmpty label="Music highlights coming soon" />
      )}
    </SectionWrapper>
  )
}
