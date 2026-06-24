import type { Metadata } from 'next'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { BrowsePageShell } from '@/app/_components/public/BrowsePageShell'
import { GigsBrowseClient } from '@/app/_components/public/GigsBrowseClient'
import { fetchPublicArtistName, fetchPublicGigs } from '@/lib/public-fetch'

export const metadata: Metadata = {
  title: 'Tour Dates',
  description: 'Browse all upcoming and past events with search and filters.',
}

export const revalidate = 60

export default async function GigsBrowsePage() {
  let gigs = [] as Awaited<ReturnType<typeof fetchPublicGigs>>
  let artistName = 'ZARDONIC'

  try {
    ;[gigs, artistName] = await Promise.all([fetchPublicGigs(), fetchPublicArtistName()])
  } catch {
    // Safe defaults when Supabase is unavailable
  }

  return (
    <LegalPageShell>
      <BrowsePageShell title="Tour Dates" streamLabel="// EVENTS.BROWSE">
        <GigsBrowseClient gigs={gigs} artistName={artistName} />
      </BrowsePageShell>
    </LegalPageShell>
  )
}