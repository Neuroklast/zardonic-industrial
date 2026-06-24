import { z } from 'zod'

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

/** Shared contact form validation (client overlay + server action). */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(MAX_EMAIL_LENGTH, `Email must be at most ${MAX_EMAIL_LENGTH} characters`),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(MAX_SUBJECT_LENGTH, `Subject must be at most ${MAX_SUBJECT_LENGTH} characters`),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`),
  /** Honeypot field — must be empty for legitimate submissions */
  _hp: z.string().max(0).optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>