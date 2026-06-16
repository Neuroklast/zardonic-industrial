import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { galleryImageSchema, type GalleryImage } from '@/lib/schemas/gallery'
import { DEMO_GALLERY } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'
const LEGACY_SUPABASE_HOST = 'supabase.co'

export async function getAllGalleryImages(): Promise<ServiceResult<GalleryImage[]>> {
  if (isDev) return ok(DEMO_GALLERY)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(100)

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const images: GalleryImage[] = []

    for (const row of data ?? []) {
      let url: string | null = null

      if (row.storage_path) {
        url = storage.getPublicUrl(MEDIA_BUCKET, String(row.storage_path))
      } else if (row.image_url) {
        const legacyUrl = String(row.image_url)
        if (legacyUrl.includes(LEGACY_SUPABASE_HOST)) {
          console.warn(
            `[galleryService] Row ${String(row.id)} has a legacy Supabase image_url and no storage_path — skipping. Re-upload via admin to fix.`,
          )
          continue
        }
        url = legacyUrl
      }

      if (!url) continue

      const parsed = galleryImageSchema.safeParse({
        id: String(row.id),
        url,
        alt: row.alt ?? undefined,
        caption: row.caption ?? undefined,
        order: row.display_order ?? 0,
      })
      if (parsed.success) images.push(parsed.data)
    }

    if (images.length === 0 && !hideDemoFallback) return ok(DEMO_GALLERY)
    return ok(images)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load gallery')
  }
}
