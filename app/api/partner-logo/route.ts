import { NextResponse } from 'next/server'
import { parsePartnerLogoProxyUrl, rewriteSvgForHiResRaster } from '@/lib/partner-logo-white'
import { assertSafeRemoteUrl } from '@/lib/ssrf-guard'

const MAX_SVG_BYTES = 2 * 1024 * 1024

/**
 * Same-origin SVG rewrite for partner logos.
 * Public r2.dev does not send Access-Control-Allow-Origin, so the browser
 * cannot fetch() the SVG to upsize it. We fetch server-side instead.
 */
export async function GET(request: Request) {
  const target = parsePartnerLogoProxyUrl(new URL(request.url).searchParams.get('url'))
  if (!target) {
    return new NextResponse('Bad request', { status: 400 })
  }

  try {
    await assertSafeRemoteUrl(target)
    const upstream = await fetch(target, {
      headers: { Accept: 'image/svg+xml,text/xml,application/xml,*/*' },
      cache: 'force-cache',
    })
    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: 502 })
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength === 0 || buf.byteLength > MAX_SVG_BYTES) {
      return new NextResponse('Invalid logo', { status: 422 })
    }

    const text = new TextDecoder('utf-8').decode(buf)
    if (!/<svg/i.test(text)) {
      return new NextResponse('Not an SVG', { status: 415 })
    }

    const rewritten = rewriteSvgForHiResRaster(text)
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    })
  } catch {
    return new NextResponse('Logo fetch failed', { status: 502 })
  }
}
