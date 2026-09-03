import { z } from 'zod'
import { safeExternalUrl } from '@/lib/safe-external-url'

export const musicHighlightSchema = z.object({
  id: z.string(),
  title: z.string(),
  youtubeUrl: safeExternalUrl,
  description: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  active: z.boolean().default(true),
})

export type MusicHighlight = z.infer<typeof musicHighlightSchema>
