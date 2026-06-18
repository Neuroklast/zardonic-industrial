import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { soundpackSchema, type Soundpack } from '@/lib/schemas/soundpack'
import { DEMO_SOUNDPACKS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export async function getAllSoundpacks(): Promise<ServiceResult<Soundpack[]>> {
  if (isDev) return ok(DEMO_SOUNDPACKS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('soundpacks')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const soundpacks: Soundpack[] = []

    for (const row of data ?? []) {
      let imageUrl: string | null = null

      if (row.image_storage_path) {
        try {
          imageUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.image_storage_path))
        } catch {
          imageUrl = row.image_url ?? null
        }
      } else if (row.image_url) {
        imageUrl = String(row.image_url)
      }

      const parsed = soundpackSchema.safeParse({
        id: String(row.id),
        title: String(row.title ?? ''),
        imageUrl,
        imageStoragePath: row.image_storage_path ?? null,
        externalUrl: row.external_url ?? null,
        displayOrder: row.display_order ?? 0,
        active: row.active ?? true,
      })

      if (parsed.success) soundpacks.push(parsed.data)
    }

    if (soundpacks.length === 0 && !hideDemoFallback) return ok(DEMO_SOUNDPACKS)
    return ok(soundpacks)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load soundpacks')
  }
}
