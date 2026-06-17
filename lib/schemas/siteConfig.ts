import { z } from 'zod'

export const siteConfigSchema = z.object({
  key: z.string(),
  value: z.unknown(),
})

export type SiteConfig = z.infer<typeof siteConfigSchema>
