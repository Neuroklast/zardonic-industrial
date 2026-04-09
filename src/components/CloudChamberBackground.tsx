import React, { memo } from 'react'

/**
 * Cloud Chamber Background
 *
 * CSS-based atmospheric background matching the signal-static aesthetic
 * from the minimal-dark-techno reference repo. Uses layered CSS animations:
 * scanlines, noise grain, vignette, subtle grid, signal interference.
 * No canvas / rAF loop — GPU-composited, zero JS overhead.
 */
const CloudChamberBackground = memo(function CloudChamberBackground({
  glowColor,
}: {
  /** Optional CSS colour to tint the interference glow. */
  glowColor?: string
}) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true" style={glowColor ? { '--cc-glow': glowColor } as React.CSSProperties : undefined}>
      {/* Repeating horizontal scanlines that slowly drift downwards */}
      <div className="cc-scanlines" />

      {/* Animated noise / static grain */}
      <div className="cc-noise" />

      {/* Subtle dot grid */}
      <div className="cc-grid" />

      {/* Slow signal interference sweep */}
      <div className="cc-interference" />

      {/* Radial dark vignette */}
      <div className="cc-vignette" />

      {/* Occasional CRT flicker */}
      <div className="cc-flicker" />
    </div>
  )
})

export default CloudChamberBackground

