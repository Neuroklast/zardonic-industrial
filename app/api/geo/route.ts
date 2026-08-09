import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Lightweight geo hint for public locale selection.
 * Uses Vercel edge country header when present; falls back to XX.
 */
export async function GET() {
  const h = await headers()
  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('x-country-code') ||
    'XX'

  return NextResponse.json(
    { country: country.toUpperCase() },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    },
  )
}
