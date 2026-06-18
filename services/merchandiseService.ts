import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { merchandiseSchema, type Merchandise } from '@/lib/schemas/merchandise'
import { DEMO_MERCHANDISE } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export async function getAllMerchandise(): Promise<ServiceResult<Merchandise[]>> {
  if (isDev) return ok(DEMO_MERCHANDISE)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const items: Merchandise[] = []

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

      const parsed = merchandiseSchema.safeParse({
        id: String(row.id),
        title: String(row.title ?? ''),
        imageUrl,
        imageStoragePath: row.image_storage_path ?? null,
        externalUrl: row.external_url ?? null,
        displayOrder: row.display_order ?? 0,
        active: row.active ?? true,
      })

      if (parsed.success) items.push(parsed.data)
    }

    if (items.length === 0 && !hideDemoFallback) return ok(DEMO_MERCHANDISE)
    return ok(items)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load merchandise')
  }
}
