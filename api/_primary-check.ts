/**
 * Primary instance detection — server-side utility for API routes.
 * SECURITY: hostname-based check; env vars must never be used for this check.
 */

const PRIMARY_HOSTNAMES = [
  'zardonic.industrial',
  'www.zardonic.industrial',
  'zardonic-industrial.vercel.app',
]

export function isPrimaryHost(host: string | undefined): boolean {
  if (!host) return false
  const hostname = host.split(':')[0]
  return PRIMARY_HOSTNAMES.includes(hostname)
}
