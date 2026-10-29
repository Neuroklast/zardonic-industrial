'use server'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { createActionClient } from '@/lib/supabaseServer'
import { getActiveMcpClient } from '@/lib/mcp/client-registry'
import { isValidOAuthAuthorizationId } from '@/lib/mcp/authorization-id'
import { attestMcpOAuthMfa } from '@/lib/mcp/mfa-grants'

export async function decideMcpOAuth(formData: FormData) {
  await requireAdmin()
  const authorizationId = String(formData.get('authorization_id') ?? '')
  const decision = formData.get('decision')
  if (!isValidOAuthAuthorizationId(authorizationId) || !['approve', 'deny'].includes(String(decision))) {
    throw new Error('Invalid authorization decision')
  }
  const supabase = await createActionClient()
  const { data: details, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !details || !('authorization_id' in details)) throw new Error('Authorization request unavailable')
  const oauthClient = details.client as { id?: string; client_id?: string }
  const clientId = oauthClient.id ?? oauthClient.client_id
  if (!clientId || !(await getActiveMcpClient(clientId))) throw new Error('OAuth client is not allowlisted')

  // OAuth JWTs have their own Supabase AAL1 session; record consent-bound MFA
  // evidence server-side after verifying the current browser administrator AAL2.
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assuranceError || assurance?.currentLevel !== 'aal2') throw new Error('MFA authentication is required for MCP access')

  const result = decision === 'approve'
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId)
  if (result.error || !result.data?.redirect_url) throw new Error('OAuth authorization decision failed')
  if (decision === 'approve') {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('MCP administrator session unavailable')
    await attestMcpOAuthMfa(user.id, clientId)
  }
  const destination = new URL(result.data.redirect_url)
  if (destination.protocol !== 'https:') throw new Error('OAuth redirect must use HTTPS')
  redirect(destination.toString())
}
