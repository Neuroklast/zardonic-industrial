import { Export } from '@phosphor-icons/react/dist/ssr'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { buildSiteBackupCounts, SITE_BACKUP_EXCLUDED } from '@/lib/site-data-backup'
import type { SiteBackupClient } from '@/lib/site-data-backup'
import { DataImportClient } from './DataImportClient'
import { DataMaintenanceClient } from './DataMaintenanceClient'

export const dynamic = 'force-dynamic'

export default async function DataPage() {
  let counts: Record<string, number> = {}
  let warnings: string[] = []
  let fetchError = ''

  try {
    const result = await buildSiteBackupCounts(createAdminClient() as unknown as SiteBackupClient)
    counts = result.counts
    warnings = result.warnings
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Unknown error'
  }

  return (
    <div>
      <AdminPageHeader
        title="Data Export & Import"
        description="Download a full JSON backup of all site content (including manually edited releases, news, drafts, and site config) or restore from an export file."
      />

      {fetchError && (
        <div className="mb-4 bg-red-900/20 border border-red-700/40 rounded p-3 text-red-300 text-sm">
          Error loading data: {fetchError}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 bg-amber-900/20 border border-amber-700/40 rounded p-3 text-amber-200 text-sm space-y-1">
          {warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">Full Site Export</h2>
            <p className="text-xs text-zinc-400 mt-1">
              All content tables: releases (including <code className="text-zinc-300">manually_edited</code>),
              news, gigs, gallery, bio, partners, social links, music highlights, merchandise,
              soundpacks, and every <code className="text-zinc-300">site_config</code> key. Inactive/draft
              rows are included. Media files in R2 are referenced by URL, not bundled.
            </p>
          </div>

          <a
            href="/admin/data/export"
            download
            aria-label="Download JSON export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors shrink-0 min-h-[44px]"
          >
            <Export className="h-4 w-4" aria-hidden="true" />
            Download JSON
          </a>
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          {Object.entries(counts).map(([key, count]) => (
            <div key={key}>
              {key}: {count} {count === 1 ? 'record' : 'records'}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          Not included (on purpose): {SITE_BACKUP_EXCLUDED.join(', ')}.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <DataMaintenanceClient />
        <DataImportClient />
      </div>
    </div>
  )
}
