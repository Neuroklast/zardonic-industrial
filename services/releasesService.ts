import { createClient } from '@/lib/supabaseServer'
import { getStorageProvider } from '@/lib/storage'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { releaseSchema, type Release } from '@/lib/schemas/release'
import { DEMO_RELEASES } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'zardonic-media'

export async function getAllReleases(): Promise<ServiceResult<Release[]>> {
  if (isDev) return ok(DEMO_RELEASES)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .limit(100)

    if (error) return err(error.message)

    const storage = getStorageProvider()
    const releases: Release[] = []

    for (const row of data ?? []) {
      let coverUrl: string | null = null

      if (row.cover_storage_path) {
        try {
          coverUrl = storage.getPublicUrl(MEDIA_BUCKET, String(row.cover_storage_path))
        } catch {
          coverUrl = row.cover_url ? String(row.cover_url) : null
        }
      } else if (row.cover_url) {
        coverUrl = String(row.cover_url)
      }

      const parsed = releaseSchema.safeParse({
        id: String(row.id),
        title: String(row.title ?? ''),
        type: row.type ?? 'single',
        releaseDate: row.release_date ?? null,
        description: row.description ?? null,
        coverUrl,
        coverStoragePath: row.cover_storage_path ?? null,
        streamingLinks: Array.isArray(row.streaming_links) ? row.streaming_links : [],
        artists: Array.isArray(row.artists) ? row.artists : [],
        displayOrder: row.display_order ?? 0,
      })
      if (parsed.success) releases.push(parsed.data)
    }

    if (releases.length === 0 && !hideDemoFallback) return ok(DEMO_RELEASES)
    return ok(releases)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load releases')
  }
}

export async function getReleaseById(id: string): Promise<ServiceResult<Release>> {
  if (isDev) {
    const found = DEMO_RELEASES.find((r) => r.id === id)
    return found ? ok(found) : err('Release not found')
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return err(error.message)
    if (!data) return err('Release not found')

    const storage = getStorageProvider()
    let coverUrl: string | null = null

    if (data.cover_storage_path) {
      try {
        coverUrl = storage.getPublicUrl(MEDIA_BUCKET, String(data.cover_storage_path))
      } catch {
        coverUrl = data.cover_url ? String(data.cover_url) : null
      }
    } else if (data.cover_url) {
      coverUrl = String(data.cover_url)
    }

    const parsed = releaseSchema.safeParse({
      id: String(data.id),
      title: String(data.title ?? ''),
      type: data.type ?? 'single',
      releaseDate: data.release_date ?? null,
      description: data.description ?? null,
      coverUrl,
      coverStoragePath: data.cover_storage_path ?? null,
      streamingLinks: Array.isArray(data.streaming_links) ? data.streaming_links : [],
      artists: Array.isArray(data.artists) ? data.artists : [],
      displayOrder: data.display_order ?? 0,
    })

    if (!parsed.success) return err('Invalid release data')
    return ok(parsed.data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load release')
  }
}
