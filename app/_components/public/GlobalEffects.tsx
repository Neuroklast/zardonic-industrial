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
}

export function GlobalEffects({
  crtEnabled = true,
  scanlineEnabled = true,
  noiseEnabled = true,
  noiseIntensity = 0.4,
  filmGrain = false,
  chromaticStrength = 0.5,
}: GlobalEffectsProps) {
  const chroma = Math.min(1, Math.max(0, chromaticStrength))
  // Map 0–1 → 0–10px-scale var so the slider is visibly effective
  const globalChromatic = chroma * 10

  return (
    <>
      {crtEnabled ? <div className="crt-overlay" /> : null}
      {crtEnabled ? <div className="crt-vignette" /> : null}
      {scanlineEnabled ? <div className="crt-scanline-bg" /> : null}
      {noiseEnabled ? (
        <div
          className={`full-page-noise periodic-noise-glitch${filmGrain ? ' film-grain' : ''}`}
          style={{ ['--noise-opacity' as string]: String(noiseIntensity) }}
        />
      ) : null}
      {chroma > 0.01 ? (
        <div
          className="global-chromatic-overlay"
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
