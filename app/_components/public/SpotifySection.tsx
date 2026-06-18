'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { m } from 'framer-motion'
import { Play, Warning } from '@phosphor-icons/react'

interface SpotifySectionProps {
  /** Spotify artist/embed URI, e.g. "spotify:artist:7BqEidErPMNiUXCRE0dV2n" */
  uri: string
  label?: string
}

// Local interface definitions aligned with components/SpotifyEmbed.tsx global types
interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number; theme?: string },
    callback?: (controller: SpotifyEmbedController) => void,
  ): void
}
interface SpotifyEmbedController {
  loadUri(uri: string): void
  play(): void
  togglePlay(): void
  seek(seconds: number): void
  destroy(): void
}

const SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1'
const LOAD_TIMEOUT_MS = 15_000

function SpotifyEmbed({ uri }: { uri: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  const initializedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hasError, setHasError] = useState(false)

  const initPlayer = useCallback((api: SpotifyIFrameAPI) => {
    if (initializedRef.current || !containerRef.current) return
    initializedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    api.createController(
      containerRef.current,
      { uri, width: '100%', height: 352, theme: '0' },
      (ctrl) => { controllerRef.current = ctrl },
    )
  }, [uri])

  useEffect(() => {
    // Cast via unknown to avoid re-declaring global augmentations here;
    // the authoritative augmentation lives in components/SpotifyEmbed.tsx.
    const win = window as unknown as {
      SpotifyIframeApi?: SpotifyIFrameAPI
      onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void
    }

    if (win.SpotifyIframeApi) {
      initPlayer(win.SpotifyIframeApi)
      return
    }

    const prev = win.onSpotifyIframeApiReady
    win.onSpotifyIframeApiReady = (api) => {
      win.SpotifyIframeApi = api
      initPlayer(api)
      prev?.(api)
    }

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }

    timeoutRef.current = setTimeout(() => setHasError(true), LOAD_TIMEOUT_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      controllerRef.current?.destroy()
    }
  }, [initPlayer])

  if (hasError) {
    return (
      <div className="flex items-center gap-3 border border-yellow-500/40 bg-yellow-500/5 px-4 py-3 font-mono text-sm text-yellow-400">
        <Warning size={18} aria-hidden="true" />
        <span>Spotify player failed to load.{' '}
          <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="underline">
            Open on Spotify
          </a>
        </span>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" aria-label="Spotify player" />
}

export function SpotifySection({ uri, label = 'MUSIC STREAM' }: SpotifySectionProps) {
  const [consented, setConsented] = useState(false)

  return (
    <section
      id="spotify"
      className="py-section px-card"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="card border primary"
    >
      <div className="container mx-auto max-w-4xl">
        <m.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
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

          {consented ? (
            <SpotifyEmbed uri={uri} />
          ) : (
            <div className="border border-primary/30 bg-card/40 p-8 text-center space-y-4">
              <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                // SPOTIFY.EMBED — Requires external connection to open.spotify.com
              </p>
              <p className="font-mono text-xs text-muted-foreground/70 max-w-lg mx-auto">
                Loading the Spotify player will establish a connection to Spotify&apos;s servers,
                which may process your IP address. Click to consent and load the player.
              </p>
              <button
                type="button"
                onClick={() => setConsented(true)}
                className="inline-flex items-center gap-2 border border-primary/60 bg-primary/10 hover:bg-primary/20 px-6 py-2.5 font-mono text-sm uppercase tracking-wider text-primary transition-all"
                aria-label="Load Spotify player (connects to spotify.com)"
              >
                <Play size={16} weight="fill" aria-hidden="true" />
                Load Player
              </button>
            </div>
          )}
        </m.div>
      </div>
    </section>
  )
}
