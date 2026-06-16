import { z } from 'zod'

export const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  order: z.number().default(0),
})

export type GalleryImage = z.infer<typeof galleryImageSchema>
