import { z } from 'zod'
import { safeExternalUrlNullable } from '@/lib/safe-external-url'

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: safeExternalUrlNullable,
  logoUrl: z.string().nullable().optional(),
  logoStoragePath: z.string().nullable().optional(),
  category: z.string().default('partner'),
  displayOrder: z.number().default(0),
})

export type Partner = z.infer<typeof partnerSchema>
