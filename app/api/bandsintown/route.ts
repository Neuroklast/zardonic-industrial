import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchBandsintownEventsFromApi } from '@/lib/bandsintown-sync'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  artist: z.string().min(1),
  include_past: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    artist: searchParams.get('artist') ?? undefined,
    include_past: searchParams.get('include_past') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const apiKey = process.env.BANDSINTOWN_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'BANDSINTOWN_API_KEY not configured',
        message: 'Please set BANDSINTOWN_API_KEY environment variable',
      },
      { status: 503 },
    )
  }

  try {
    const events = await fetchBandsintownEventsFromApi(
      parsed.data.artist,
      apiKey,
      parsed.data.include_past,
    )

    return NextResponse.json(
      { events },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=3600' },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bandsintown fetch failed'
    console.error('[bandsintown] proxy error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}