import { NextResponse, type NextRequest } from 'next/server'
import { contactFormSchema } from '@/lib/contact-form'
import { deliverContactMessage } from '@/lib/contact-delivery'
import { recordContactEvent } from '@/lib/contact-diagnostics'
import { consumeRateLimitForRequest } from '@/lib/rate-limit'
import { readResponseWithLimit } from '@/lib/limited-response-body'

export const dynamic = 'force-dynamic'
const HEADERS = { 'Cache-Control': 'no-store' }

/** Public API path is stable across deployments, unlike a Server Action ID. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: HEADERS })
  }
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data') && !contentType.startsWith('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'Unsupported content type.' }, { status: 415, headers: HEADERS })
  }
  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > 32768) {
    return NextResponse.json({ error: 'Message is too large.' }, { status: 413, headers: HEADERS })
  }

  let body: Buffer
  try {
    body = await readResponseWithLimit(new Response(request.body), 32768)
  } catch (error) {
    const oversized = error instanceof Error && /exceeds the permitted size/.test(error.message)
    return NextResponse.json(
      { error: oversized ? 'Message is too large.' : 'Invalid request body.' },
      { status: oversized ? 413 : 400, headers: HEADERS },
    )
  }
  let data: FormData
  try {
    data = await new Request(request.url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Uint8Array.from(body),
    }).formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400, headers: HEADERS })
  }
  // Honeypot submissions appear successful, but never trigger delivery.
  if (String(data.get('_hp') ?? '').trim()) {
    return NextResponse.json({ success: true }, { headers: HEADERS })
  }
  const parsed = contactFormSchema.safeParse({
    name: data.get('name'), email: data.get('email'),
    subject: data.get('subject'), message: data.get('message'), _hp: '',
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill in all required fields correctly.' }, { status: 400, headers: HEADERS })
  }
  try {
    const result = await consumeRateLimitForRequest(request, {
      namespace: 'contact', limit: 5, windowSeconds: 15 * 60,
    })
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again in a few minutes.' },
        { status: 429, headers: { ...HEADERS, ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}) } },
      )
    }
  } catch (error) {
    console.error('[contact] Rate limit failed:', error instanceof Error ? error.name : 'unknown error')
    await recordContactEvent({ category: 'rate_limit', code: 'rate_limit_unavailable', detail: 'Rate limiter unavailable. Check server secrets and Supabase RPC.' })
    return NextResponse.json({ error: 'Contact form is temporarily unavailable.' }, { status: 503, headers: HEADERS })
  }
  const result = await deliverContactMessage(parsed.data)
  return NextResponse.json(result, { status: result.success ? 200 : 503, headers: HEADERS })
}
