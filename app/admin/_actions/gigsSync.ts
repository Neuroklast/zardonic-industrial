'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { getApiSecret } from '@/lib/api-secrets'
import {
  resolveBandsintownArtistName,
  syncBandsintownGigsToSupabase,
  type BandsintownSyncResult,
} from '@/lib/bandsintown-sync'
import { revalidatePath } from 'next/cache'

export type GigsSyncResult = BandsintownSyncResult

export async function syncGigsFromBandsintown(): Promise<GigsSyncResult | { error: string }> {
  const apiKey = await getApiSecret('bandsintown_api_key')
  if (!apiKey) {
    return {
      error: 'Bandsintown API key is not configured. Set it in Admin → API Keys.',
    }
  }

  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminAction(
    'bandsintown_gigs_sync',
    {},
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const artistName = await resolveBandsintownArtistName(supabaseAdmin)
    const result = await syncBandsintownGigsToSupabase(supabaseAdmin, artistName, apiKey)

    revalidatePath('/admin/gigs')
    revalidatePath('/')
    return result
  }, 'Unable to sync gigs from Bandsintown.')
}