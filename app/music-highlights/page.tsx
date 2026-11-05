import type { Metadata } from 'next'
import { BrowsePageShell } from '@/app/_components/public/BrowsePageShell'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { MusicHighlightsBrowseClient } from '@/app/_components/public/MusicHighlightsBrowseClient'
import { fetchPublicMusicHighlights } from '@/lib/public-fetch'
import { isSupabaseConfigured } from '@/lib/supabaseServer'

export const metadata: Metadata = {
  title: 'Music Highlights',
  description: 'Browse all music videos and highlights from Zardonic.',
}
export const revalidate = 60

export default async function MusicHighlightsBrowsePage() {
  let items: Awaited<ReturnType<typeof fetchPublicMusicHighlights>> = []
  try {
    items = await fetchPublicMusicHighlights()
  } catch (error) {
    if (isSupabaseConfigured()) throw error
  }

  return (
    <LegalPageShell>
      <BrowsePageShell title="Music Highlights" streamLabel="// MUSIC.HIGHLIGHTS">
        <MusicHighlightsBrowseClient items={items} />
      </BrowsePageShell>
    </LegalPageShell>
  )
}
