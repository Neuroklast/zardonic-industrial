import type { createAdminClient } from '@/lib/supabaseAdmin'
import {
  dispatchAdminAction,
  type AdminActionContext,
  type AdminActionResult,
} from '@/lib/admin-action-registry'

/**
 * Dispatch for authenticated Next.js admin server actions.
 * Passes `expert` disclosure — real authorization is `requireAdmin()`.
 */
export function dispatchAdminActionAsAdmin(
  actionId: string,
  rawInput: unknown,
  ctx: AdminActionContext,
): AdminActionResult {
  return dispatchAdminAction(actionId, rawInput, ctx, 'expert')
}

/** Helper to build minimal ctx for Supabase-backed dispatch calls (temp for migration).
 * TODO: extend AdminActionContext or create Supabase-only variant.
 */
export function createSupabaseActionContext(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
): AdminActionContext {
  return {
    adminSettings: {} as AdminActionContext['adminSettings'],
    siteData: {} as AdminActionContext['siteData'],
    setAdminSettings: () => {},
    setSiteData: () => {},
    supabaseAdmin,
  }
}
