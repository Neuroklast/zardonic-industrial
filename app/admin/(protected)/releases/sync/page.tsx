import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import { CatalogueSyncClient } from './CatalogueSyncClient'

export default async function ExternalSyncPage() {
  let catalogueConfig = parseCatalogueSyncConfig(null)

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'catalogue_sync')
      .maybeSingle()
    catalogueConfig = parseCatalogueSyncConfig(data?.value)
  } catch {
    // use defaults
  }

  return (
    <div>
      <AdminPageHeader
        title="Catalogue Sync"
        description="Configure platform artist IDs and bulk-import releases from iTunes, Spotify, and Discogs."
        action={
          <Link
            href="/admin/releases"
            className="px-3 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            ← Discography
          </Link>
        }
      />
      <CatalogueSyncClient initialConfig={catalogueConfig} />
    </div>
  )
}