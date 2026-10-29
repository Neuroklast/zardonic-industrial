'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/app/admin/_actions/auth'
import { getAdminUserId } from '@/lib/api-admin-auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { createActionClient } from '@/lib/supabaseServer'
import { z } from 'zod'

const uuid = z.string().uuid()

/**
 * Explicit human review only. A single database transaction locks the pending
 * proposal and affected content, checks a complete snapshot, applies changes
 * and writes the review audit record. Failures roll back the entire transaction.
 */
export async function reviewMcpContent(
  requestId: string,
  decision: 'approve' | 'reject',
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    const session = await createActionClient()
    const { data: assurance, error: assuranceError } = await session.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceError || assurance?.currentLevel !== 'aal2') {
      return { error: 'MFA (AAL2) is required to review AI content' }
    }
    const reviewer = await getAdminUserId()
    if (!reviewer || !uuid.safeParse(requestId).success || (decision !== 'approve' && decision !== 'reject')) {
      return { error: 'Invalid review request' }
    }
    const admin = createAdminClient()

    if (decision === 'reject') {
      const { data, error } = await admin.from('mcp_content_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: reviewer })
        .eq('id', requestId).eq('status', 'pending').select('id').maybeSingle()
      if (error || !data) return { error: 'Request was already reviewed' }
      revalidatePath('/admin/ai-content')
      return { success: true }
    }

    // SECURITY: Never perform a separate read/check/write from JS here.
    // The DB function performs locked compare-and-swap + audit atomically.
    const { data: status, error } = await admin.rpc('mcp_apply_content_request', {
      p_request_id: requestId,
      p_reviewer: reviewer,
    })
    if (error) {
      console.error('[MCP review] atomic approval failed:', error.code ?? 'unknown')
      return { error: 'Approval failed. No content changes were committed.' }
    }
    if (status === 'conflict') {
      revalidatePath('/admin/ai-content')
      return { error: 'Content changed since the proposal. Submit a new proposal.' }
    }
    if (status !== 'approved') return { error: 'Request was already reviewed' }

    revalidatePath('/', 'layout')
    for (const path of [
      '/admin/ai-content', '/news', '/gigs', '/releases', '/media',
      '/soundpacks', '/gallery', '/partners', '/admin/site-config',
    ]) {
      revalidatePath(path)
    }
    return { success: true }
  } catch {
    return { error: 'Administrator authentication or review service unavailable' }
  }
}
