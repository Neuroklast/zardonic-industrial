import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { shouldForceInsecureCookies } from '@/lib/supabaseServer'
import { readBearerToken, verifyCronSecret } from '@/lib/cron-auth'
import { parseCatalogueSyncConfig } from '@/lib/catalogue-sync-config'
import {
  buildReleaseEnrichmentUpdate,
  releaseNeedsEnrichment,
  type ReleaseEnrichmentRow,
} from '@/lib/release-enrichment'

export const dynamic = 'force-dynamic'

const ENRICHMENT_SELECT =
  'id, title, tracks, manually_edited, spotify_id, discogs_id, itunes_id, tracks_source, last_enriched_at, streaming_links'

const CRON_BATCH_LIMIT = 15

async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          const finalOptions = { ...options }
          if (shouldForceInsecureCookies(null)) finalOptions.secure = false
          cookieStore.set(name, value, finalOptions)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return (profile as { role?: string } | null)?.role === 'admin'
}

export async function POST(request: Request) {
  const bearer = readBearerToken(request.headers.get('authorization'))
  const isCron = verifyCronSecret(bearer)

  if (!isCron) {
    const admin = await isAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createAdminClient()
    const { data: configRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'catalogue_sync')
      .maybeSingle()

    const artistName = parseCatalogueSyncConfig(configRow?.value).artistName || 'Zardonic'

    const { data: rows, error: listError } = await supabase
      .from('releases')
      .select(ENRICHMENT_SELECT)
      .eq('manually_edited', false)
      .order('display_order', { ascending: true })

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const candidates = (rows ?? []).filter((row: ReleaseEnrichmentRow) =>
      releaseNeedsEnrichment(row),
    )
    const batch = candidates.slice(0, CRON_BATCH_LIMIT)

    let enriched = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of batch) {
      const release = row as ReleaseEnrichmentRow
      const update = await buildReleaseEnrichmentUpdate(release, artistName)
      if (!update) {
        skipped++
        continue
      }

      const { error: updateError } = await supabase.from('releases').update(update).eq('id', release.id)
      if (updateError) {
        skipped++
        errors.push(`"${release.title}": ${updateError.message}`)
        continue
      }

      enriched++
    }

    return NextResponse.json(
      {
        success: true,
        enriched,
        skipped,
        remaining: Math.max(0, candidates.length - batch.length),
        errors,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[releases-track-enrich] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to enrich release tracklists' }, { status: 500 })
  }
}