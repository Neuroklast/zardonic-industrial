import { z } from 'zod'

const MAX_EMAIL_LENGTH = 254

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(MAX_EMAIL_LENGTH)
    .transform((value) => value.toLowerCase()),
  consent_given: z.literal('true'),
  /** Honeypot — must be empty for legitimate submissions */
  _hp: z.string().max(0).optional(),
})

export const newsletterTokenSchema = z
  .string()
  .trim()
  .min(32, 'Invalid token')
  .max(128, 'Invalid token')
  .regex(/^[a-f0-9]+$/, 'Invalid token')

export const newsletterCampaignSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(50000),
})

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>