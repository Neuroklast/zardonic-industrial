import { z } from 'zod'

export const bioSchema = z.object({
  id: z.string(),
  content: z.string().nullable().optional(),
})

export type Bio = z.infer<typeof bioSchema>
