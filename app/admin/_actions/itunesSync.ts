'use server'

import { runAdminAction, createSupabaseActionContext } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { uploadBufferToR2 } from './r2Upload'
import { MEDIA_BUCKET } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'
const R2_BUCKET = MEDIA_BUCKET

export interface ItunesSyncResult {
  synced: number
  skipped: number
  errors: string[]
}

interface ItunesResult {
  collectionId?: number
  trackId?: number
  collectionName?: string
  trackName?: string
  wrapperType?: string
  kind?: string
  collectionType?: string
  artworkUrl100?: string
  releaseDate?: string
  primaryGenreName?: string
}

function parseItunesItem(item: ItunesResult): {
  title: string
  type: string
  release_date: string | null
  itunes_id: string
  artworkUrl: string | null
} | null {
  const isAlbum =
    item.wrapperType === 'collection' &&
    (item.collectionType === 'Album' || item.collectionType === 'Single')
  const isSingle = item.wrapperType === 'track' && item.kind === 'music-video'

  if (!isAlbum && !isSingle) return null

  const title = item.collectionName ?? item.trackName
  if (!title) return null

  const rawId = item.collectionId ?? item.trackId
  if (!rawId) return null

  const nameLower = title.toLowerCase()
  let type = 'album'
  if (nameLower.includes(' ep') || nameLower.endsWith(' ep')) type = 'ep'
  else if (nameLower.includes('single') || item.collectionType === 'Single') type = 'single'
  else if (nameLower.includes('remix') || nameLower.includes('remixed')) type = 'remix'
  else if (nameLower.includes('compilation') || nameLower.includes('best of')) type = 'compilation'

  const artworkUrl = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '1000x1000bb')
    : null

  const release_date = item.releaseDate ? item.releaseDate.slice(0, 10) : null

  return { title, type, release_date, itunes_id: String(rawId), artworkUrl }
}

export async function syncReleasesFromItunes(artist: string): Promise<ItunesSyncResult> {
  const result: ItunesSyncResult = { synced: 0, skipped: 0, errors: [] }

  if (!artist.trim()) {
    result.errors.push('Artist name is required')
    return result
  }

  const actionResult = await runAdminAction(async () => {
    const [albumsRes, singlesRes] = await Promise.allSettled([
      fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artist)}&entity=album&limit=200`),
      fetch(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(artist)}&entity=musicVideo&limit=200`),
    ])

    const items: ItunesResult[] = []

    if (albumsRes.status === 'fulfilled' && albumsRes.value.ok) {
      const data = (await albumsRes.value.json()) as { results?: ItunesResult[] }
      items.push(...(data.results ?? []))
    } else {
      result.errors.push('Failed to fetch albums from iTunes')
    }

    if (singlesRes.status === 'fulfilled' && singlesRes.value.ok) {
      const data = (await singlesRes.value.json()) as { results?: ItunesResult[] }
      items.push(...(data.results ?? []))
    }

    if (items.length === 0 && result.errors.length > 0) return result

    const supabase = createAdminClient()

    // Gate via registry for AGENTS §12 compliance on mutations
    const dispatchResult = dispatchAdminAction('itunes_sync', { artist }, createSupabaseActionContext(supabase))
    if (!dispatchResult.ok) return { synced: 0, skipped: 0, errors: [dispatchResult.error] }

    const { data: existing } = await supabase
      .from('releases')
      .select('itunes_id')
      .not('itunes_id', 'is', null)

    const existingIds = new Set((existing ?? []).map((row) => row.itunes_id as string))

    const { data: maxRow } = await supabase
      .from('releases')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    let displayOrder = ((maxRow as { display_order?: number } | null)?.display_order ?? -1) + 1

    for (const item of items) {
      const parsed = parseItunesItem(item)
      if (!parsed) continue

      if (existingIds.has(parsed.itunes_id)) {
        result.skipped++
        continue
      }

      let coverStoragePath: string | null = null
      let coverUrl: string | null = parsed.artworkUrl

      if (parsed.artworkUrl && process.env.R2_ACCOUNT_ID) {
        try {
          const artRes = await fetch(parsed.artworkUrl)
          if (artRes.ok) {
            const buffer = Buffer.from(await artRes.arrayBuffer())
            const objectPath = `releases/itunes-${parsed.itunes_id}.jpg`
            const { publicUrl } = await uploadBufferToR2(R2_BUCKET, objectPath, buffer, 'image/jpeg')
            coverStoragePath = objectPath
            coverUrl = publicUrl
          }
        } catch (error) {
          result.errors.push(
            `Artwork upload failed for "${parsed.title}": ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      const { error: insertError } = await supabase.from('releases').insert({
        title: parsed.title,
        type: parsed.type,
        release_date: parsed.release_date,
        itunes_id: parsed.itunes_id,
        cover_storage_path: coverStoragePath,
        cover_url: coverUrl,
        streaming_links: [],
        artists: [artist],
        display_order: displayOrder,
        active: true,
      })

      if (insertError) {
        result.errors.push(`Failed to insert "${parsed.title}": ${insertError.message}`)
      } else {
        result.synced++
        displayOrder++
        existingIds.add(parsed.itunes_id)
      }
    }

    revalidatePath('/admin/releases')
    revalidatePath('/')

    return result
  }, 'Unable to sync releases from iTunes.')

  return 'error' in actionResult ? { synced: 0, skipped: 0, errors: [actionResult.error] } : actionResult
}
