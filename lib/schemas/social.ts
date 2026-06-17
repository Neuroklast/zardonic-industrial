import { z } from 'zod'

export const socialLinkSchema = z.object({
  id: z.string(),
  platform: z.string(),
  url: z.string().url(),
  label: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
})

export type SocialLink = z.infer<typeof socialLinkSchema>
