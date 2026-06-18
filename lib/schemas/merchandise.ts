import { z } from 'zod'

export const merchandiseSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().nullable().optional(),
  imageStoragePath: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  active: z.boolean().default(true),
})

export type Merchandise = z.infer<typeof merchandiseSchema>
