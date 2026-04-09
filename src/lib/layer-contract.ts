/**
 * Z-INDEX LAYER CONTRACT
 * ======================
 * Defines the immutable stacking order for all visual layers in the application.
 *
 * Rule: Animated backgrounds MUST use z-index <= ANIMATED_BG and MUST NOT carry
 * an opaque solid background fill when rendered in "transparent" (overlay) mode.
 * All UI content (sections, footer, nav overlays) MUST use z-index >= CONTENT.
 * CRT/noise effects MUST sit above content so they apply to everything, but they
 * MUST be pointer-events: none so they never block interaction.
 *
 * Stacking order (lowest → highest):
 *   BACKGROUND_IMAGE (0) → ANIMATED_BG (2) → CONTENT (3) → CRT_VIGNETTE (9997)
 *   → CRT_OVERLAY (9998) → NOISE (9999)
 *
 * These values are consumed directly by inline styles and Tailwind z-* utilities.
 * Changing a value here requires updating every usage site.
 */

export const LAYERS = {
  /** Fixed background image – deepest layer, always below everything. */
  BACKGROUND_IMAGE: 0,
  /** Animated overlay effects (MatrixRain, CircuitBackground, etc.).
   *  MUST be above BACKGROUND_IMAGE, MUST be below CONTENT.
   *  MUST NOT paint an opaque background fill when in transparent/overlay mode. */
  ANIMATED_BG: 2,
  /** All UI content: sections, footer, nav-sub-menus, modals.
   *  MUST be strictly above ANIMATED_BG. */
  CONTENT: 3,
  /** CRT vignette – decorative, above all content but pointer-events: none. */
  CRT_VIGNETTE: 9997,
  /** CRT overlay scanlines – decorative, above all content but pointer-events: none. */
  CRT_OVERLAY: 9998,
  /** Film-grain noise – decorative, topmost layer but pointer-events: none. */
  NOISE: 9999,
} as const

export type LayerKey = keyof typeof LAYERS
export type LayerValue = (typeof LAYERS)[LayerKey]

/** Invariants the test suite enforces. Any violation breaks the build. */
export const LAYER_INVARIANTS = {
  /** Animated background must always be below content. */
  ANIMATED_BG_BELOW_CONTENT: LAYERS.ANIMATED_BG < LAYERS.CONTENT,
  /** Background image must always be the deepest layer. */
  BG_IMAGE_DEEPEST: LAYERS.BACKGROUND_IMAGE < LAYERS.ANIMATED_BG,
  /** CRT/noise effects must always be above content. */
  CRT_ABOVE_CONTENT: LAYERS.CRT_VIGNETTE > LAYERS.CONTENT,
  NOISE_ABOVE_CRT: LAYERS.NOISE > LAYERS.CRT_OVERLAY,
} as const
