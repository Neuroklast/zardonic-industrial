import { z } from 'zod'
import { safeExternalUrlNullable } from '@/lib/safe-external-url'

export const gigSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  eventDate: z.string(),
  ticketUrl: safeExternalUrlNullable,
  festivalName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export type Gig = z.infer<typeof gigSchema>
