import { NextResponse } from 'next/server'
import { parsePartnerLogoProxyUrl, rewriteSvgForHiResRaster } from '@/lib/partner-logo-white'
import { canonicalizeR2MediaUrl } from '@/lib/r2-url-rewrite'
import { assertSafeRemoteUrl } from '@/lib/ssrf-guard'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'

const MAX_LOGO_BYTES = 8 * 1024 * 1024
const RASTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function sniffRasterType(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return 'image/png'
  }
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
  if (b.length >= 4 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) {
    return 'image/webp'
  }
  return null
}

/**
 * Same-origin partner logo fetch. Public r2.dev has no CORS; this also rewrites
 * leftover `pub-*.r2.dev` hosts onto `R2_PUBLIC_HOST` before the upstream GET.
 */
export async function GET(request: Request) {
  const requested = parsePartnerLogoProxyUrl(new URL(request.url).searchParams.get('url'))
  if (!requested) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Bound the outbound-fetch cost / bandwidth abuse.
  try {
    const rl = await consumeRateLimitForRequest(request, {
      namespace: 'partner-logo',
      limit: 60,
      windowSeconds: 60,
    })
    if (!rl.allowed) {
      return new NextResponse('Rate limited', { status: 429 })
    }
  } catch (err) {
    console.warn('[partner-logo] rate limit unavailable, rejecting (fail-closed):', err)
    return new NextResponse('Rate limited', { status: 429 })
  }

  const target = canonicalizeR2MediaUrl(requested)
  if (!parsePartnerLogoProxyUrl(target)) {
    return new NextResponse('Bad request', { status: 400 })
  }

  try {
    await assertSafeRemoteUrl(target)
    const upstream = await fetch(target, {
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,*/*' },
      cache: 'force-cache',
    })
    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: 502 })
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength === 0 || buf.byteLength > MAX_LOGO_BYTES) {
      return new NextResponse('Invalid logo', { status: 422 })
    }

    const headerType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    const sniffed = sniffRasterType(buf)
    const contentType = RASTER_TYPES.has(headerType) ? headerType : sniffed ?? headerType
    const looksSvg =
      !sniffed &&
      (contentType === 'image/svg+xml' ||
        contentType === 'text/xml' ||
        contentType === 'application/xml' ||
        new TextDecoder('utf-8').decode(buf.slice(0, 256)).includes('<svg'))

    if (looksSvg) {
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
    }

    if (!RASTER_TYPES.has(contentType) && contentType !== 'application/octet-stream') {
      return new NextResponse('Unsupported logo type', { status: 415 })
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType === 'application/octet-stream' ? 'image/png' : contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Logo fetch failed', { status: 502 })
  }
}
