/** Single source of truth for DEV_MODE flag. */
export const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

/**
 * When true, all demo fallbacks in services are disabled.
 * Set NEXT_PUBLIC_HIDE_DEMO_FALLBACK=true to show empty sections instead of demo content.
 */
export const hideDemoFallback = process.env.NEXT_PUBLIC_HIDE_DEMO_FALLBACK === 'true'
