import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import {
  buildOgHtml,
  fallbackOg,
  getSiteOrigin,
  resolveGigOg,
  resolveReleaseOg,
} from '@/lib/og-share'

const ALLOWED_TYPES = new Set(['release', 'gig'])
const ID_PATTERN = /^[\w-]+$/

export async function GET(request: Request): Promise<NextResponse> {
  const origin = getSiteOrigin()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id) {
    return NextResponse.redirect(origin, 302)
  }

  if (!ALLOWED_TYPES.has(type) || !ID_PATTERN.test(id)) {
    return NextResponse.redirect(origin, 302)
  }

  const supabase = await createClient()
  const artistName = process.env.SITE_NAME || 'Zardonic'

  let meta = fallbackOg(type)

  if (type === 'release') {
    const { data } = await supabase
      .from('releases')
      .select('id, title, type, description, cover_storage_path, cover_url')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle()

    if (data) {
      meta = resolveReleaseOg(data, artistName)
    }
  }

  if (type === 'gig') {
    const { data } = await supabase
      .from('gigs')
      .select('id, title, venue, city, country, event_date')
      .eq('id', id)
      .maybeSingle()

    if (data) {
      meta = resolveGigOg(data, artistName)
    }
  }

  const html = buildOgHtml(origin, meta, artistName)
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}