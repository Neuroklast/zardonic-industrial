import { z } from 'zod'

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  R2_PUBLIC_HOST: z.string().min(1, 'R2_PUBLIC_HOST is required').optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_MEDIA: z.string().min(1).optional().default('zardonic-media'),
  NEXT_PUBLIC_DEV_MODE: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_HIDE_DEMO_FALLBACK: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_SHOW_DEMO_BADGE: z.enum(['true', 'false']).optional().default('false'),
  RESEND_API_KEY: z.string().min(1).optional(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_DEV_MODE: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_HIDE_DEMO_FALLBACK: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_SHOW_DEMO_BADGE: z.enum(['true', 'false']).optional().default('false'),
})

const parseEnv = () => {
  const isServer = typeof window === 'undefined'
  const schema = isServer ? serverEnvSchema : clientEnvSchema
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(`\n❌ Invalid environment variables:\n${missing}\n`)
  }
  return parsed.data
}

export const env = parseEnv()
