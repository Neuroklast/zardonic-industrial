// RFC 9728 metadata for the protected MCP resource.
// OAuth discovery is delegated to Supabase Auth. Discovery intentionally works
// before an OAuth client ID has been registered; the MCP API itself stays
// fail-closed until ZARDONIC_MCP_CLIENT_ID is explicitly configured.
export const dynamic = 'force-dynamic'

export function GET() {
  const issuer = process.env.NEXT_PUBLIC_SUPABASE_URL
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app'
  if (!issuer) {
    return Response.json({ error: 'MCP integration not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  return Response.json({
    resource: new URL('/api/mcp', site).toString(),
    authorization_servers: [new URL('/auth/v1', issuer).toString()],
    bearer_methods_supported: ['header'],
  }, { headers: { 'Cache-Control': 'no-store' } })
}
