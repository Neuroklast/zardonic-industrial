import { createAdminClient } from '@/lib/supabaseAdmin'

export const MCP_PROVIDER_IDS = ['chatgpt', 'claude', 'opencode', 'gemini', 'cursor', 'other'] as const
export type McpProviderId = (typeof MCP_PROVIDER_IDS)[number]

export type McpRegisteredClient = {
  client_id: string
  provider: McpProviderId
  display_name: string
  enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * OWASP A01: MCP OAuth tokens are granted access only after registration and
 * independent authorization in this server-controlled database allowlist.
 * Supabase OAuth registration alone never permits content tools.
 *
 * Always consult this record on each request, including refresh-token reuse.
 */
export async function getActiveMcpClient(clientId: string): Promise<McpRegisteredClient | null> {
  if (!/^[A-Za-z0-9._:-]{8,180}$/.test(clientId)) return null
  const admin = createAdminClient()
  const { data, error } = await admin.from('mcp_oauth_clients')
    .select('client_id,provider,display_name,enabled,created_at,updated_at')
    .eq('client_id', clientId).eq('enabled', true).maybeSingle()
  if (error) throw new Error('MCP OAuth allowlist unavailable')
  return (data as McpRegisteredClient | null) ?? null
}
