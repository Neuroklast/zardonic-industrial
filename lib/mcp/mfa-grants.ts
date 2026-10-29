import { createAdminClient } from '@/lib/supabaseAdmin'
import { getActiveMcpClient } from '@/lib/mcp/client-registry'

/**
 * Called ONLY after the server has verified admin role and current browser AAL2.
 * Supabase issues a separate OAuth client session at AAL1 even when the
 * browser's consent session is at AAL2. This attestation binds MFA approval to
 * that user/client for up to 30 days and is never directly writable by users.
 */
export async function attestMcpOAuthMfa(userId: string, clientId: string): Promise<void> {
  if (!/^[a-f0-9-]{36}$/i.test(userId) || !await getActiveMcpClient(clientId)) {
    throw new Error('MCP client is not authorized')
  }
  const now = Date.now()
  const admin = createAdminClient()
  const { error } = await admin.from('mcp_oauth_mfa_grants').upsert({
    user_id: userId,
    client_id: clientId,
    verified_at: new Date(now).toISOString(),
    expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'user_id,client_id' })
  if (error) throw new Error('MCP MFA attestation could not be stored')
}

/**
 * Rechecks the real Supabase Auth OAuth session and active OAuth consent
 * using a service-role-only SECURITY DEFINER RPC. OAuth JWT claims alone
 * never establish MFA proof.
 */
export async function verifyMcpOAuthMfaGrant(userId: string, clientId: string, sessionId: string): Promise<boolean> {
  if (!/^[a-f0-9-]{36}$/i.test(sessionId) || !/^[a-f0-9-]{36}$/i.test(userId)) return false
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('mcp_verify_oauth_mfa_grant', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_client_id: clientId,
  })
  if (error) throw new Error('MCP OAuth attestation lookup unavailable')
  return data === true
}
