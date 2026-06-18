interface GlobalEffectsProps {
  crtEnabled?: boolean
  scanlineEnabled?: boolean
  noiseEnabled?: boolean
}

export function GlobalEffects({
  crtEnabled = true,
  scanlineEnabled = true,
  noiseEnabled = true,
}: GlobalEffectsProps) {
  return (
    <>
      {crtEnabled ? <div className="crt-overlay" /> : null}
      {crtEnabled ? <div className="crt-vignette" /> : null}
      {scanlineEnabled ? <div className="crt-scanline-bg" /> : null}
      {noiseEnabled ? <div className="full-page-noise periodic-noise-glitch" /> : null}
    </>
  )
}
