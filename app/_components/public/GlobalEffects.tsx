interface GlobalEffectsProps {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
  /** 0–1 film grain strength (CSS --noise-opacity). */
  noiseIntensity?: number
  /** Use denser film-grain pattern when true. */
  filmGrain?: boolean
}

export function GlobalEffects({
  crtEnabled = true,
  scanlineEnabled = true,
  noiseEnabled = true,
  noiseIntensity = 0.4,
  filmGrain = false,
}: GlobalEffectsProps) {
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
    </>
  )
}
