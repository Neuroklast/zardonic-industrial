import { z } from 'zod'

export const DISPLAY_ORDER_REORDER_MAX = 500

export const orderedIdsSchema = z.array(z.string().min(1)).min(1).max(DISPLAY_ORDER_REORDER_MAX)

export const orderedIdsInputSchema = z.object({ orderedIds: orderedIdsSchema })

export type ReorderableTable =
  | 'gallery'
  | 'merchandise'
  | 'soundpacks'
  | 'music_highlights'
  | 'media_downloads'
  | 'news_posts'

export function nextDisplayOrderFromMax(max: number | null | undefined): number {
  return typeof max === 'number' ? max + 1 : 0
}
