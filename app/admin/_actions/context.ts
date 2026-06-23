import type { createAdminClient } from '@/lib/supabaseAdmin'
import type { AdminActionContext } from '@/lib/admin-action-registry'

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
