'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
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

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(parsed.data.value)
  } catch {
    return { error: 'Value must be valid JSON' }
  }

  const supabaseAdmin = createAdminClient()

  // Dispatch via registry (AGENTS §12)
  const dispatchResult = dispatchAdminActionAsAdmin('update_site_config', { key: parsed.data.key, value: parsedJson }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin
      .from('site_config')
      .upsert(
        { key: parsed.data.key, value: parsedJson, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )

    if (error) return { error: error.message }

    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/legal-notice')
    revalidatePath('/privacy-policy')
    revalidatePath('/admin')
    revalidatePath('/admin/site-config')
    revalidatePath('/admin/legal')
    revalidatePath('/admin/translations')
    revalidatePath('/admin/analytics')
    return { success: true }
  }, 'Unable to save site configuration.')
}
