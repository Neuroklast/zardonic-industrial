import { NextResponse } from 'next/server'
import { analyticsPostSchema } from '@/api/_schemas'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { isAnalyticsTrackingAllowed, parseAnalyticsConfig } from '@/lib/analytics-config'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = analyticsPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'analytics')
      .maybeSingle()

    const config = parseAnalyticsConfig(data?.value)
    if (!isAnalyticsTrackingAllowed(config, parsed.data.type)) {
      return new NextResponse(null, { status: 204 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('analytics_events').insert({
      type: parsed.data.type,
      target: parsed.data.target ?? null,
      meta: parsed.data.meta ?? null,
      heatmap: parsed.data.heatmap ?? null,
    })

    if (error) {
      console.warn('[analytics] insert failed:', error.message)
    }
  } catch (e) {
    console.warn('[analytics] handler error:', e instanceof Error ? e.message : e)
  }

  return new NextResponse(null, { status: 204 })
}