'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { getAdminUserId } from '@/lib/api-admin-auth'
import { createActionClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { MCP_PROVIDER_IDS, type McpProviderId } from '@/lib/mcp/client-registry'
import { attestMcpOAuthMfa } from '@/lib/mcp/mfa-grants'

export type McpClientChange =
  | { success: true; outcome: 'added' | 'updated' | 'unchanged' | 'deleted' | 'verified' }
  | { success: false; error: 'mfa' | 'invalid' | 'database' | 'not_found' }

function changeError(error: unknown): McpClientChange {
  if (error instanceof Error && (
    error.message === 'Verify your admin authenticator first' ||
    error.message === 'Administrator authentication required'
  )) return { success: false, error: 'mfa' }
  return { success: false, error: 'database' }
}

async function mfaAdminUser(): Promise<string> {
  await requireAdmin()
  const session = await createActionClient()
  const { data, error } = await session.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || data?.currentLevel !== 'aal2') throw new Error('Verify your admin authenticator first')
  const userId = await getAdminUserId()
  if (!userId) throw new Error('Administrator authentication required')
  return userId
}

const clientIdRegex = /^[A-Za-z0-9._:-]{8,180}$/

export async function registerMcpClient(formData: FormData): Promise<McpClientChange> {
  try {
    const userId = await mfaAdminUser()
    const clientId = String(formData.get('client_id') ?? '').trim()
    const displayName = String(formData.get('display_name') ?? '').trim()
    const provider = String(formData.get('provider') ?? '')
    if (!clientIdRegex.test(clientId) || displayName.length < 2 || displayName.length > 80 ||
        !MCP_PROVIDER_IDS.includes(provider as McpProviderId)) {
      return { success: false, error: 'invalid' }
    }
    // Only client IDs already registered with Supabase OAuth should be added.
    // This allowlist alone does NOT create OAuth credentials or redirect URIs.
    const admin = createAdminClient()
    const { data: existing, error: readError } = await admin.from('mcp_oauth_clients')
      .select('client_id,provider,display_name,enabled').eq('client_id', clientId).maybeSingle()
    if (readError) return { success: false, error: 'database' }

    if (existing) {
      if (existing.enabled && existing.display_name === displayName && existing.provider === provider) {
        return { success: true, outcome: 'unchanged' }
      }
      const { data: updated, error: updateError } = await admin.from('mcp_oauth_clients')
        .update({
          display_name: displayName, provider, enabled: true,
          updated_by: userId, updated_at: new Date().toISOString(),
        }).eq('client_id', clientId).select('client_id').maybeSingle()
      if (updateError || !updated) return { success: false, error: 'database' }
      revalidatePath('/admin/integrations')
      return { success: true, outcome: 'updated' }
    }

    const { error } = await admin.from('mcp_oauth_clients').insert({
      client_id: clientId, display_name: displayName, provider,
      enabled: true, created_by: userId, updated_by: userId,
    })
    if (error) return { success: false, error: 'database' }
    revalidatePath('/admin/integrations')
    return { success: true, outcome: 'added' }
  } catch (error) {
    return changeError(error)
  }
}

export async function setMcpClientEnabled(clientId: string, enabled: boolean): Promise<McpClientChange> {
  try {
    const userId = await mfaAdminUser()
    if (!clientIdRegex.test(clientId) || typeof enabled !== 'boolean') {
      return { success: false, error: 'invalid' }
    }
    const admin = createAdminClient()
    const { data, error } = await admin.from('mcp_oauth_clients')
      .update({ enabled, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('client_id', clientId).eq('enabled', !enabled)
      .select('client_id').maybeSingle()
    if (error) return { success: false, error: 'database' }
    if (!data) return { success: true, outcome: 'unchanged' }
    revalidatePath('/admin/integrations')
    return { success: true, outcome: 'updated' }
  } catch (error) {
    return changeError(error)
  }
}

export async function deleteMcpClient(clientId: string): Promise<McpClientChange> {
  try {
    await mfaAdminUser()
    if (!clientIdRegex.test(clientId)) return { success: false, error: 'invalid' }
    // OWASP A01: Removing the allowlist row takes effect on the NEXT MCP request,
    // even for already-issued tokens. Supabase OAuth app revocation is separate.
    const admin = createAdminClient()
    const { data, error } = await admin.from('mcp_oauth_clients')
      .delete().eq('client_id', clientId).select('client_id').maybeSingle()
    if (error) return { success: false, error: 'database' }
    if (!data) return { success: false, error: 'not_found' }
    revalidatePath('/admin/integrations')
    return { success: true, outcome: 'deleted' }
  } catch (error) {
    return changeError(error)
  }
}

/**
 * Recover previously connected OAuth clients without creating new credentials.
 * Only a currently MFA-verified admin may attest their own authorized client.
 * The protected RPC checks that actual Supabase OAuth consent still exists
 * when processing future MCP tool requests.
 */
export async function verifyMcpClientMfa(clientId: string): Promise<McpClientChange> {
  try {
    const userId = await mfaAdminUser()
    if (!clientIdRegex.test(clientId)) return { success: false, error: 'invalid' }
    await attestMcpOAuthMfa(userId, clientId)
    revalidatePath('/admin/integrations')
    return { success: true, outcome: 'verified' }
  } catch (error) {
    return changeError(error)
  }
}
