import type { Metadata } from 'next'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { BrowsePageShell } from '@/app/_components/public/BrowsePageShell'
import { MediaBrowseClient } from '@/app/_components/public/MediaBrowseClient'
import { fetchPublicMediaDownloads } from '@/lib/public-fetch'

export const metadata: Metadata = {
  title: 'Media',
  description: 'Download photos, logos, documents and audio from Zardonic.',
}

export const revalidate = 60

export default async function MediaBrowsePage() {
  let items = [] as Awaited<ReturnType<typeof fetchPublicMediaDownloads>>

  try {
    items = await fetchPublicMediaDownloads()
  } catch {
    // Safe defaults when Supabase is unavailable
  }

  return (
    <LegalPageShell>
      <BrowsePageShell title="Media" streamLabel="// MEDIA.DOWNLOADS">
        <MediaBrowseClient items={items} />
      </BrowsePageShell>
    </LegalPageShell>
  )
}
