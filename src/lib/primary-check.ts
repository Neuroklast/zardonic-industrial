/**
 * Primary instance detection utilities.
 * SECURITY: hostname-based check; env vars must never be used for this check.
 */

const PRIMARY_HOSTNAMES = [
  'zardonic.industrial',
  'www.zardonic.industrial',
  'zardonic-industrial.vercel.app',
] as const

export function isPrimaryInstance(): boolean {
  if (typeof window === 'undefined') return false
  return (PRIMARY_HOSTNAMES as readonly string[]).includes(window.location.hostname)
}
