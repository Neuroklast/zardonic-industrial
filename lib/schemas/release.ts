import { z } from 'zod'

export const streamingLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url(),
  label: z.string().optional(),
})

export const releaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['album', 'ep', 'single', 'remix', 'compilation']).default('single'),
  releaseDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverStoragePath: z.string().nullable().optional(),
  streamingLinks: z.array(streamingLinkSchema).default([]),
  artists: z.array(z.string()).default([]),
  displayOrder: z.number().default(0),
})

export type StreamingLink = z.infer<typeof streamingLinkSchema>
export type Release = z.infer<typeof releaseSchema>
