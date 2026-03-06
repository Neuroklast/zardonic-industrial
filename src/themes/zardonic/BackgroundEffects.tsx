export default function BackgroundEffects() {
  return (
    <>
      <div className="zardonic-theme-crt-overlay" />
      <div className="zardonic-theme-crt-vignette" />
      <div className="zardonic-theme-full-page-noise zardonic-theme-periodic-noise-glitch" />
      <div className="zardonic-theme-circuit-bg-wrapper">
        <div className="zardonic-theme-circuit-line" style={{ top: '20%', left: '10%', width: '100px', height: '2px' }} />
        <div className="zardonic-theme-circuit-line" style={{ top: '40%', right: '15%', width: '2px', height: '80px' }} />
        <div className="zardonic-theme-circuit-line" style={{ bottom: '30%', left: '25%', width: '120px', height: '2px' }} />
        <div className="zardonic-theme-circuit-node" style={{ top: '20%', left: '110px' }} />
        <div className="zardonic-theme-circuit-node" style={{ top: '40%', right: '15%' }} />
        <div className="zardonic-theme-circuit-node" style={{ bottom: '30%', left: '145px' }} />
      </div>
    </>
  )
}
