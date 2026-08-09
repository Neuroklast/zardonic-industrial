'use client'

import { useIsMobile } from '@/hooks/use-mobile'

interface GlobalEffectsProps {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
  /** 0–1 film grain strength (CSS --noise-opacity). */
  noiseIntensity?: number
  /** Use denser film-grain pattern when true. */
  filmGrain?: boolean
  /**
   * 0–1 chromatic aberration strength (admin Appearance slider).
   * Applies a full-page RGB fringe overlay + drives --chromatic-strength for hovers.
   */
  chromaticStrength?: number
  /**
   * Force lite mode (weaker noise/chroma). Defaults to true on mobile via useIsMobile.
   */
  lite?: boolean
}

export function GlobalEffects({
  crtEnabled = true,
  scanlineEnabled = true,
  noiseEnabled = true,
  noiseIntensity = 0.4,
  filmGrain = false,
  chromaticStrength = 0.5,
  lite,
}: GlobalEffectsProps) {
  const isMobile = useIsMobile()
  const liteMode = lite ?? isMobile

  // Mobile-lite: quieter grain + weaker chromatic fringe so scroll/LCP stay calm
  const effectiveNoise = liteMode ? noiseIntensity * 0.5 : noiseIntensity
  const effectiveChroma = liteMode ? chromaticStrength * 0.35 : chromaticStrength
  const showNoise = noiseEnabled && effectiveNoise >= 0.08
  const chroma = Math.min(1, Math.max(0, effectiveChroma))
  // Map 0–1 → 0–10px-scale var so the slider is visibly effective
  const globalChromatic = chroma * 10

  return (
    <>
      {crtEnabled ? (
        <div className={`crt-overlay${liteMode ? ' global-fx-lite' : ''}`} />
      ) : null}
      {crtEnabled ? (
        <div className={`crt-vignette${liteMode ? ' global-fx-lite' : ''}`} />
      ) : null}
      {scanlineEnabled ? (
        <div className={`crt-scanline-bg${liteMode ? ' global-fx-lite' : ''}`} />
      ) : null}
      {showNoise ? (
        <div
          className={[
            'full-page-noise',
            liteMode ? '' : 'periodic-noise-glitch',
            filmGrain ? 'film-grain' : '',
            liteMode ? 'global-fx-lite' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ ['--noise-opacity' as string]: String(effectiveNoise) }}
        />
      ) : null}
      {chroma > 0.01 ? (
        <div
          className={`global-chromatic-overlay${liteMode ? ' global-fx-lite' : ''}`}
          aria-hidden="true"
          data-draft-target="global-chromatic"
          style={
            {
              ['--global-chromatic' as string]: String(globalChromatic),
              ['--chromatic-strength' as string]: String(chroma),
            } as React.CSSProperties
          }
        />
      ) : null}
    </>
  )
}
