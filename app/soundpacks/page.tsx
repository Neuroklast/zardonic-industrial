import type { Metadata } from 'next'
import { BrowsePageShell } from '@/app/_components/public/BrowsePageShell'
import { LegalPageShell } from '@/app/_components/public/LegalPageShell'
import { SoundpacksBrowseClient } from '@/app/_components/public/SoundpacksBrowseClient'
import { fetchPublicSoundpacks } from '@/lib/public-fetch'
import { isSupabaseConfigured } from '@/lib/supabaseServer'

export const metadata: Metadata = {
  title: 'Soundpacks & Presets',
  description: 'Find Zardonic soundpacks and presets.',
}
export const revalidate = 60

export default async function SoundpacksBrowsePage() {
  let items: Awaited<ReturnType<typeof fetchPublicSoundpacks>> = []
  try {
    items = await fetchPublicSoundpacks()
  } catch (error) {
    if (isSupabaseConfigured()) throw error
  }

  return (
    <LegalPageShell>
      <BrowsePageShell title="Soundpacks & Presets" streamLabel="// SOUNDPACKS.BROWSE">
        <SoundpacksBrowseClient items={items} />
      </BrowsePageShell>
    </LegalPageShell>
  )
}
