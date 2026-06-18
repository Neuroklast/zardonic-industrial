import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { musicHighlightSchema, type MusicHighlight } from '@/lib/schemas/musicHighlight'
import { DEMO_MUSIC_HIGHLIGHTS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

export async function getAllMusicHighlights(): Promise<ServiceResult<MusicHighlight[]>> {
  if (isDev) return ok(DEMO_MUSIC_HIGHLIGHTS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('music_highlights')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return err(error.message)

    const highlights: MusicHighlight[] = []

    for (const row of data ?? []) {
      const parsed = musicHighlightSchema.safeParse({
        id: String(row.id),
        title: String(row.title ?? ''),
        youtubeUrl: String(row.youtube_url ?? ''),
        description: row.description ?? null,
        displayOrder: row.display_order ?? 0,
        active: row.active ?? true,
      })

      if (parsed.success) highlights.push(parsed.data)
    }

    if (highlights.length === 0 && !hideDemoFallback) return ok(DEMO_MUSIC_HIGHLIGHTS)
    return ok(highlights)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load music highlights')
  }
}
