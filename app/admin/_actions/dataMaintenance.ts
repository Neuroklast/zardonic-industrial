'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { syncGigsFromBandsintown } from '@/app/admin/_actions/gigsSync'
import { syncReleasesFromSpotify } from '@/app/admin/_actions/releaseExternalSync'
import { enrichAllReleasesTracks } from '@/app/admin/_actions/releaseTrackEnrichment'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'

export interface PurgeResult {
  deleted: number
}

export interface MaintenanceSyncResult {
  purge: PurgeResult
  sync: unknown
}

async function purgeAutoSyncedReleases(): Promise<PurgeResult> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('releases')
    .delete({ count: 'exact' })
    .eq('manually_edited', false)

  if (error) throw new Error(error.message)
  return { deleted: count ?? 0 }
}

async function purgeAllGigs(): Promise<PurgeResult> {
  const supabase = createAdminClient()
  const { count, error } = await supabase.from('gigs').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw new Error(error.message)
  return { deleted: count ?? 0 }
}

export async function purgeReleases(): Promise<PurgeResult | { error: string }> {
  const dispatchResult = dispatchAdminAction(
    'purge_releases',
    { scope: 'auto_synced' },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const result = await purgeAutoSyncedReleases()
    revalidatePath('/admin/releases')
    revalidatePath('/')
    return result
  }, 'Unable to purge releases.')
}

export async function purgeGigs(): Promise<PurgeResult | { error: string }> {
  const dispatchResult = dispatchAdminAction(
    'purge_gigs',
    {},
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const result = await purgeAllGigs()
    revalidatePath('/admin/gigs')
    revalidatePath('/')
    return result
  }, 'Unable to purge gigs.')
}

export async function resetReleaseTracklists(): Promise<PurgeResult | { error: string }> {
  const dispatchResult = dispatchAdminAction(
    'reset_release_tracklists',
    {},
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('releases')
      .update({
        tracks: [],
        tracks_source: null,
        last_enriched_at: null,
      })
      .eq('manually_edited', false)
      .select('id')

    if (error) return { error: error.message }

    revalidatePath('/admin/releases')
    revalidatePath('/')
    return { deleted: data?.length ?? 0 }
  }, 'Unable to reset release tracklists.')
}

export async function purgeAndSyncReleases(): Promise<MaintenanceSyncResult | { error: string }> {
  const dispatchResult = dispatchAdminAction(
    'purge_and_sync_releases',
    {},
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const purge = await purgeAutoSyncedReleases()
    const sync = await syncReleasesFromSpotify()
    const enrich = await enrichAllReleasesTracks({ limit: 50 })

    revalidatePath('/admin/releases')
    revalidatePath('/')

    return {
      purge,
      sync: {
        ...sync,
        trackEnrichment: enrich,
      },
    }
  }, 'Unable to purge and sync releases.')
}

export async function purgeAndSyncGigs(): Promise<MaintenanceSyncResult | { error: string }> {
  const dispatchResult = dispatchAdminAction(
    'purge_and_sync_gigs',
    {},
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const purge = await purgeAllGigs()
    const sync = await syncGigsFromBandsintown()

    revalidatePath('/admin/gigs')
    revalidatePath('/')

    return { purge, sync }
  }, 'Unable to purge and sync gigs.')
}