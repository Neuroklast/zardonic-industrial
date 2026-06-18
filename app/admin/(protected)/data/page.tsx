import { createClient } from '@/lib/supabaseServer'
import { Export } from '@phosphor-icons/react/dist/ssr'

// Server action: build a JSON export of all site data
async function buildExportData() {
  const supabase = await createClient()
  const [
    { data: releases },
    { data: gigs },
    { data: gallery },
    { data: bio },
    { data: partners },
    { data: social },
    { data: musicHighlights },
    { data: merchandise },
    { data: soundpacks },
    { data: config },
  ] = await Promise.all([
    supabase.from('releases').select('*').order('display_order'),
    supabase.from('gigs').select('*').order('event_date'),
    supabase.from('gallery').select('*').order('display_order'),
    supabase.from('bio').select('*').limit(1).single(),
    supabase.from('partners').select('*').order('display_order'),
    supabase.from('social_links').select('*').order('display_order'),
    supabase.from('music_highlights').select('*').order('display_order'),
    supabase.from('merchandise').select('*').order('display_order'),
    supabase.from('soundpacks').select('*').order('display_order'),
    supabase.from('site_config').select('key, value'),
  ])
  return { releases, gigs, gallery, bio, partners, social, musicHighlights, merchandise, soundpacks, config }
}

export default async function DataPage() {
  let exportData: Record<string, unknown> = {}
  let fetchError = ''
  try {
    exportData = await buildExportData()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Unknown error'
  }

  const exportJson = JSON.stringify(exportData, null, 2)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Data Export</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Download a full JSON backup of all site content from Supabase.
        </p>
      </div>

      {fetchError && (
        <div className="mb-4 bg-red-900/20 border border-red-700/40 rounded p-3 text-red-300 text-sm">
          Error loading data: {fetchError}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">Full Site Export</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Includes releases, gigs, gallery, bio, partners, social links,
              music highlights, merchandise, soundpacks, and site config.
            </p>
          </div>

          {/* Client-side download button */}
          <form
            onSubmit={undefined}
            action="#"
            className="shrink-0"
          >
            <button
              type="button"
              aria-label="Download JSON export"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
              onClick={undefined}
              // Rendered as a data attribute for the client-side download script below
              data-export-json={exportJson}
              id="export-download-btn"
            >
              <Export className="h-4 w-4" aria-hidden="true" />
              Download JSON
            </button>
          </form>
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          {Object.entries(exportData).map(([key, val]) => (
            <div key={key}>
              {key}: {Array.isArray(val) ? `${val.length} records` : val ? '1 record' : '—'}
            </div>
          ))}
        </div>
      </div>

      {/* Client-side script for the download button */}
      <DataExportButton exportJson={exportJson} />
    </div>
  )
}

// Thin client component just for the download interaction
function DataExportButton({ exportJson }: { exportJson: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var btn = document.getElementById('export-download-btn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var blob = new Blob([${JSON.stringify(exportJson)}], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'zardonic-export-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();
`,
      }}
    />
  )
}
