import type { Metadata } from 'next'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { BrowsePageShell } from '@/app/_components/public/BrowsePageShell'
import { ReleasesBrowseClient } from '@/app/_components/public/ReleasesBrowseClient'
import { fetchPublicArtistName, fetchPublicReleaseCardItems } from '@/lib/public-fetch'

export const metadata: Metadata = {
  title: 'Releases',
  description: 'Browse the full discography with search and filters.',
}

export const revalidate = 60

export default async function ReleasesBrowsePage() {
  let releases = [] as Awaited<ReturnType<typeof fetchPublicReleaseCardItems>>
  let artistName = 'ZARDONIC'

  try {
    ;[releases, artistName] = await Promise.all([
      fetchPublicReleaseCardItems(),
      fetchPublicArtistName(),
    ])
  } catch {
    // Safe defaults when Supabase is unavailable
  }

  return (
    <LegalPageShell>
      <BrowsePageShell title="Releases" streamLabel="// DISCOGRAPHY.BROWSE">
        <ReleasesBrowseClient releases={releases} artistName={artistName} />
      </BrowsePageShell>
    </LegalPageShell>
  )
}