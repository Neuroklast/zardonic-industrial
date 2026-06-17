import { z } from 'zod'

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  logoStoragePath: z.string().nullable().optional(),
  category: z.string().default('partner'),
  displayOrder: z.number().default(0),
})

export type Partner = z.infer<typeof partnerSchema>
