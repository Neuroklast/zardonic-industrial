'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import {
  resolveBandsintownArtistName,
  syncBandsintownGigsToSupabase,
  type BandsintownSyncResult,
} from '@/lib/bandsintown-sync'
import { revalidatePath } from 'next/cache'

export type GigsSyncResult = BandsintownSyncResult

export async function syncGigsFromBandsintown(): Promise<GigsSyncResult | { error: string }> {
  const apiKey = process.env.BANDSINTOWN_API_KEY
  if (!apiKey) {
    return {
      error: 'BANDSINTOWN_API_KEY is not configured on the server.',
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