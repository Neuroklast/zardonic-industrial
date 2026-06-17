import { z } from 'zod'

export const gigSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  eventDate: z.string(),
  ticketUrl: z.string().url().nullable().optional(),
  festivalName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export type Gig = z.infer<typeof gigSchema>
