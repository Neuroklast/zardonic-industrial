/**
 * Build-time globals injected by Vite's `define` in the original project.
 * In Next.js these are not automatically available; components guard their
 * usage with `typeof __APP_VERSION__ !== 'undefined'` checks, which fall back
 * gracefully to hard-coded defaults at runtime.
 *
 * Declare them as `string | undefined` so TypeScript accepts the typeof-guard
 * pattern without requiring them to actually be injected.
 */
declare const __APP_VERSION__: string | undefined
declare const __GIT_HASH__: string | undefined
