import { z } from 'zod'

export const musicHighlightSchema = z.object({
  id: z.string(),
  title: z.string(),
  youtubeUrl: z.string().url(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  active: z.boolean().default(true),
})

export type MusicHighlight = z.infer<typeof musicHighlightSchema>
