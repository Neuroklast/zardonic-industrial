'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext, dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { writeDisplayOrder } from '@/app/admin/_lib/displayOrder'
import { orderedIdsSchema, type ReorderableTable } from '@/lib/admin-display-order'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

async function reorderEditorialList({
  actionId,
  table,
  orderedIds,
  paths,
  errorMessage,
}: {
  actionId: string
  table: ReorderableTable
  orderedIds: string[]
  paths: string[]
  errorMessage: string
}) {
  const parsed = orderedIdsSchema.safeParse(orderedIds)
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()
  const dispatchResult = dispatchAdminActionAsAdmin(
    actionId,
    { orderedIds: parsed.data },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const result = await writeDisplayOrder(supabaseAdmin, table, parsed.data)
    if (result.error) return { error: result.error }

    for (const path of paths) {
      revalidatePath(path)
    }
    return { success: true }
  }, errorMessage)
}

export async function reorderGallery(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_gallery',
    table: 'gallery',
    orderedIds,
    paths: ['/admin/gallery', '/'],
    errorMessage: 'Unable to reorder gallery.',
  })
}

export async function reorderMerchandise(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_merchandise',
    table: 'merchandise',
    orderedIds,
    paths: ['/admin/merchandise', '/'],
    errorMessage: 'Unable to reorder merchandise.',
  })
}

export async function reorderSoundpacks(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_soundpacks',
    table: 'soundpacks',
    orderedIds,
    paths: ['/admin/soundpacks', '/'],
    errorMessage: 'Unable to reorder soundpacks.',
  })
}

export async function reorderMusicHighlights(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_music_highlights',
    table: 'music_highlights',
    orderedIds,
    paths: ['/admin/music-highlights', '/'],
    errorMessage: 'Unable to reorder music highlights.',
  })
}

export async function reorderMediaDownloads(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_media_downloads',
    table: 'media_downloads',
    orderedIds,
    paths: ['/admin/media', '/', '/media'],
    errorMessage: 'Unable to reorder media downloads.',
  })
}

export async function reorderNewsPosts(orderedIds: string[]) {
  return reorderEditorialList({
    actionId: 'reorder_news_posts',
    table: 'news_posts',
    orderedIds,
    paths: ['/admin/news', '/', '/news'],
    errorMessage: 'Unable to reorder news posts.',
  })
}
