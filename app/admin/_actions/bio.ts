'use server'

import { runAdminAction, createSupabaseActionContext } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminAction } from '@/lib/admin-action-registry'
import { revalidatePath } from 'next/cache'

export async function updateBio(formData: FormData) {
  const content = formData.get('content')
  if (typeof content !== 'string') return { error: 'Invalid content' }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminAction('update_bio', { content }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { data: existing } = await supabaseAdmin
      .from('bio')
      .select('id')
      .limit(1)
      .maybeSingle()

    let error
    if (existing) {
      ;({ error } = await supabaseAdmin
        .from('bio')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', existing.id))
    } else {
      ;({ error } = await supabaseAdmin.from('bio').insert({ content }))
    }

    if (error) return { error: error.message }
    revalidatePath('/admin/bio')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to save biography content.')
}
