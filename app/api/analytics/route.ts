import { NextResponse } from 'next/server'
import { analyticsPostSchema } from '@/api/_schemas'
import { createPublicClient } from '@/lib/supabaseServer'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'
import { isAnalyticsTrackingAllowed, parseAnalyticsConfig } from '@/lib/analytics-config'

export const dynamic = 'force-dynamic'

// One config read per cold-start plus a short in-process cache — the POST
// handler must not re-read site_config on every analytics event.
let analyticsConfigCache: { value: unknown; fetchedAt: number } | null = null
const ANALYTICS_CONFIG_TTL_MS = 5 * 60 * 1000

async function loadAnalyticsConfig(): Promise<unknown> {
  const now = Date.now()
  if (analyticsConfigCache && now - analyticsConfigCache.fetchedAt < ANALYTICS_CONFIG_TTL_MS) {
    return analyticsConfigCache.value
  }
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'analytics')
    .maybeSingle()
  analyticsConfigCache = { value: data?.value ?? null, fetchedAt: now }
  return analyticsConfigCache.value
}

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

  // Throttle anonymous event submissions (fail-closed).
  try {
    const rl = await consumeRateLimitForRequest(request, {
      namespace: 'analytics',
      limit: 30,
      windowSeconds: 60,
    })
    if (!rl.allowed) {
      return new NextResponse(null, { status: 429 })
    }
  } catch (err) {
    console.warn('[analytics] rate limit unavailable, rejecting (fail-closed):', err)
    return new NextResponse(null, { status: 429 })
  }

  try {
    const config = parseAnalyticsConfig(await loadAnalyticsConfig())
    if (!isAnalyticsTrackingAllowed(config, parsed.data.type)) {
      return new NextResponse(null, { status: 204 })
    }

    // Anon client + RLS INSERT policy (consent-gated), NOT the service-role client.
    const supabase = createPublicClient()
    const { error } = await supabase.from('analytics_events').insert({
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