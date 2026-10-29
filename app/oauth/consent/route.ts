import { isValidOAuthAuthorizationId } from '@/lib/mcp/authorization-id'

export const dynamic = 'force-dynamic'

/**
 * Compatibility endpoint for the OAuth Server's currently configured
 * Authorization Path (/oauth/consent).
 *
 * The protected admin consent screen remains canonical; do not render a
 * second public consent implementation or accept user-controlled return URLs.
 */
export function GET(request: Request) {
  const incoming = new URL(request.url)
  const authorizationId = incoming.searchParams.get('authorization_id')
  if (!isValidOAuthAuthorizationId(authorizationId)) {
    return Response.json({ error: 'Invalid OAuth authorization request' }, {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
  const destination = new URL('/admin/oauth/consent', incoming.origin)
  destination.searchParams.set('authorization_id', authorizationId)
  return new Response(null, {
    status: 303,
    headers: {
      Location: destination.toString(),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
