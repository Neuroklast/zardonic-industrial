import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { countReleasesNeedingTrackEnrichment } from '@/app/admin/_actions/releaseTrackEnrichment'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import { listActiveSyncJobs } from '@/lib/sync-jobs'
import { CatalogueSyncClient } from './CatalogueSyncClient'

export default async function ExternalSyncPage() {
  let catalogueConfig = parseCatalogueSyncConfig(null)
  let activeJob = null
  let needsEnrichment: number | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'catalogue_sync')
      .maybeSingle()
    catalogueConfig = parseCatalogueSyncConfig(data?.value)

    const activeJobs = await listActiveSyncJobs([
      'itunes_sync',
      'spotify_sync',
      'discogs_sync',
      'track_enrichment',
      'bandsintown_sync',
      'purge_and_sync_releases',
      'purge_and_sync_gigs',
    ])
    activeJob = activeJobs[0] ?? null

    const countResult = await countReleasesNeedingTrackEnrichment()
    if ('count' in countResult) needsEnrichment = countResult.count
  } catch {
    // use defaults
  }

  return (
    <div>
      <AdminPageHeader
        title="Catalogue Sync"
        description="Import releases, enrich tracklists, sync events, and run maintenance jobs — all with live progress."
        action={
          <Link
            href="/admin/releases"
            className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            ← Discography
          </Link>
        }
      />
      <CatalogueSyncClient
        initialConfig={catalogueConfig}
        activeJob={activeJob}
        needsEnrichment={needsEnrichment}
      />
    </div>
  )
}