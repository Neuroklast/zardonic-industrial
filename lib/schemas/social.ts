import { z } from 'zod'
import { safeExternalUrl } from '@/lib/safe-external-url'

export const socialLinkSchema = z.object({
  id: z.string(),
  platform: z.string(),
  url: safeExternalUrl,
  label: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
})

export type SocialLink = z.infer<typeof socialLinkSchema>
