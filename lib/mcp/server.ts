import { postgresUuid } from '@/lib/mcp/postgres-uuid'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getActiveMcpClient } from '@/lib/mcp/client-registry'
import { verifyMcpOAuthMfaGrant } from '@/lib/mcp/mfa-grants'
import { consumeStrictMcpRateLimit } from '@/lib/rate-limit'
import { allowedContentFields, CONTENT_COLLECTIONS, digestContent, filterContentRow, getContentDefinition, parseContentChanges, mayRemoveMcpContent } from '@/lib/mcp/content'
import { z } from 'zod'
import { canReadSiteContent, parseSiteContentPatch, READABLE_SITE_CONTENT, WRITABLE_SITE_CONTENT } from '@/lib/mcp/site-config'

const uuid = postgresUuid
const noCache = { 'Cache-Control': 'no-store' }

export class McpAccessError extends Error {
  constructor(message: string, public readonly status = 401) { super(message) }
}

export async function authenticateMcp(request: Request): Promise<{ userId: string; clientId: string }> {
  // OWASP A07: Fail closed unless the request carries an authorized OAuth client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new McpAccessError('MCP integration is not configured', 503)

  const auth = request.headers.get('authorization') ?? ''
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(auth) || auth.length > 6000) throw new McpAccessError('Bearer OAuth access token required')
  const token = auth.slice(7)
  const pieces = token.split('.')
  if (pieces.length !== 3) throw new McpAccessError('Malformed access token')

  // getUser(token) verifies the token with the project's Auth server. Never trust
  // decoded claims without verifying the JWT first.
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new McpAccessError('Invalid or expired access token')
  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(Buffer.from(pieces[1], 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    throw new McpAccessError('Malformed token claims')
  }
  // Supabase creates a separate OAuth session with AAL1 after an AAL2 browser
  // consent. Require that new session to be a genuine Supabase OAuth session
  // AND have explicit unexpired server-recorded MFA authorization.
  if (typeof claims.client_id !== 'string' || claims.sub !== user.id ||
      typeof claims.session_id !== 'string' ||
      (claims.aal !== 'aal1' && claims.aal !== 'aal2')) {
    throw new McpAccessError('OAuth token claims not authorized', 403)
  }
  let client
  try {
    client = await getActiveMcpClient(claims.client_id)
  } catch {
    throw new McpAccessError('MCP allowlist unavailable', 503)
  }
  if (!client) throw new McpAccessError('OAuth client is disabled or not allowlisted', 403)
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin.from('profiles')
    .select('role').eq('id', user.id).maybeSingle()
  if (profileError || profile?.role !== 'admin') throw new McpAccessError('Administrator permission required', 403)

  let mfaAttested = false
  try {
    mfaAttested = await verifyMcpOAuthMfaGrant(user.id, client.client_id, claims.session_id)
  } catch {
    throw new McpAccessError('MCP OAuth MFA verification unavailable', 503)
  }
  if (!mfaAttested) throw new McpAccessError('OAuth session requires MFA-approved client consent', 403)

  // Distributed limit, deliberately fail closed if DB is unreachable.
  const limit = await consumeStrictMcpRateLimit(request, { namespace: 'mcp:' + user.id, limit: 90, windowSeconds: 60 })
  if (!limit.allowed) throw new McpAccessError('Rate limit exceeded', 429)
  return { userId: user.id, clientId: client.client_id }
}

export function mcpUnauthorized(error: McpAccessError, request: Request) {
  // Diagnostic only: emit fixed, server-authored reasons for failed bearer
  // requests. Never log Authorization headers, tokens, users or request URLs.
  if (request.headers.get('authorization')?.startsWith('Bearer ')) {
    console.warn('[MCP_AUTH_DENIED]', error.status, error.message)
  }
  const resource = new URL('/.well-known/oauth-protected-resource/mcp', request.url).toString()
  const headers: Record<string, string> = { ...noCache }
  if (error.status === 401) headers['WWW-Authenticate'] = 'Bearer resource_metadata="' + resource + '"'
  return new Response(JSON.stringify({ error: error.message }), { status: error.status, headers: { ...headers, 'Content-Type': 'application/json' } })
}

function table(name: string) {
  const definition = getContentDefinition(name)
  if (!definition) throw new McpAccessError('Unknown editorial collection', 400)
  return definition
}

function selectFields(collection: string): string {
  return ['id', ...allowedContentFields(collection)].join(',')
}

export async function listContent(collection: string, limit: number, offset: number) {
  table(collection)
  if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 || offset > 5000) {
    throw new McpAccessError('Invalid pagination', 400)
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from(collection).select(selectFields(collection))
    .order('id', { ascending: true }).range(offset, offset + limit - 1)
  if (error) throw new Error('Content listing unavailable')
  return { collection, items: data, next_offset: data.length === limit ? offset + limit : null }
}

export async function getContent(collection: string, id: string) {
  table(collection)
  if (!uuid.safeParse(id).success) throw new McpAccessError('Invalid id', 400)
  const admin = createAdminClient()
  const { data, error } = await admin.from(collection).select(selectFields(collection)).eq('id', id).maybeSingle()
  if (error) throw new Error('Content lookup unavailable')
  if (!data) throw new McpAccessError('Item not found', 404)
  return { collection, item: data, version: digestContent(data) }
}

export async function queueContentChange(
  context: { userId: string; clientId: string },
  operation: 'create' | 'update',
  collection: string,
  changes: unknown,
  id?: string,
) {
  const definition = table(collection)
  const cleaned = parseContentChanges(collection, operation, changes)
  if (operation === 'create' && !definition.create) throw new McpAccessError('Creation blocked', 403)
  if (operation === 'update' && (!id || !uuid.safeParse(id).success)) throw new McpAccessError('Existing item id required', 400)
  let previousHash: string | null = null
  let previousSnapshot: Record<string, unknown> | null = null
  if (operation === 'update') {
    const existing = await getContent(collection, id!)
    previousHash = existing.version
    previousSnapshot = existing.item
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from('mcp_content_requests').insert({
    collection, operation, target_id: operation === 'update' ? id : null,
    changes: cleaned, previous_hash: previousHash, previous_snapshot: previousSnapshot,
    requested_by: context.userId, client_id: context.clientId,
  }).select('id, status, created_at').single()
  if (error || !data) throw new Error('Could not store content approval request')
  return { request_id: data.id, status: data.status, created_at: data.created_at, needs_admin_approval: true, review_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app'}/admin/ai-content` }
}

/**
 * Queue an editorial deletion for a separate, MFA-verified human decision.
 * The existing row remains untouched until the atomic review RPC runs.
 */
export async function queueContentRemoval(
  context: { userId: string; clientId: string },
  collection: string,
  id: string,
  reason: string,
) {
  table(collection)
  if (!mayRemoveMcpContent(collection)) throw new McpAccessError('Deletion unavailable for this collection', 403)
  if (!uuid.safeParse(id).success) throw new McpAccessError('Invalid item ID', 400)
  if (typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 500) {
    throw new McpAccessError('Provide a reason between 5 and 500 characters', 400)
  }
  const existing = await getContent(collection, id)
  const admin = createAdminClient()
  const { data, error } = await admin.from('mcp_content_requests').insert({
    collection, operation: 'delete', target_id: id, target_key: null,
    changes: { reason: reason.trim() }, previous_hash: existing.version,
    previous_snapshot: existing.item,
    requested_by: context.userId, client_id: context.clientId,
  }).select('id,status,created_at').single()
  if (error || !data) throw new Error('Could not queue deletion request')
  return {
    request_id: data.id, status: data.status, created_at: data.created_at,
    needs_admin_approval: true, review_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app'}/admin/ai-content`,
    deletion_performed: false,
  }
}

export async function listMyRequests(context: { userId: string }, limit = 20) {
  const n = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 50)) : 20
  const admin = createAdminClient()
  const { data, error } = await admin.from('mcp_content_requests')
    .select('id, collection, operation, target_id, target_key, status, created_at, reviewed_at, error')
    .eq('requested_by', context.userId).order('created_at', { ascending: false }).limit(n)
  if (error) throw new Error('Approval history unavailable')
  return { requests: data }
}

export function contentCapabilities() {
  return CONTENT_COLLECTIONS.map((collection) => ({
    collection, create: getContentDefinition(collection)?.create === true,
    writable_fields: allowedContentFields(collection),
    deletion: mayRemoveMcpContent(collection), requires_approval: true,
  }))
}


export async function getSiteContent(key: string) {
  if (!canReadSiteContent(key)) throw new McpAccessError('Site content key not readable', 403)
  const admin = createAdminClient()
  const { data, error } = await admin.from('site_config').select('key, value').eq('key', key).maybeSingle()
  if (error) throw new Error('Site text lookup unavailable')
  return { key, value: data?.value ?? null, version: digestContent({ value: data?.value ?? null }) }
}

export async function queueSiteContentChange(
  context: { userId: string; clientId: string }, key: string, changes: unknown,
) {
  const cleaned = parseSiteContentPatch(key, changes)
  const current = await getSiteContent(key)
  const admin = createAdminClient()
  const { data, error } = await admin.from('mcp_content_requests').insert({
    collection: 'site_config', operation: 'config', target_id: null, target_key: key,
    changes: cleaned, previous_hash: current.version, previous_snapshot: { value: current.value },
    requested_by: context.userId, client_id: context.clientId,
  }).select('id, status, created_at').single()
  if (error || !data) throw new Error('Could not store site text proposal')
  return { request_id: data.id, status: data.status, needs_admin_approval: true, review_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zardonic-website.vercel.app'}/admin/ai-content` }
}

export function siteContentCapabilities() {
  return { read: READABLE_SITE_CONTENT, edit: WRITABLE_SITE_CONTENT, action: 'manual approval required' }
}

export { digestContent, filterContentRow }
