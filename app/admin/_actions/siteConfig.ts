'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
})

export async function updateSiteConfig(formData: FormData) {
  const raw = {
    key: formData.get('key'),
    value: formData.get('value'),
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.message }

  // Validate value is valid JSON
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(parsed.data.value)
  } catch {
    return { error: 'Value must be valid JSON' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('site_config')
    .upsert(
      { key: parsed.data.key, value: parsedJson, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}
