'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'

export async function updateBio(formData: FormData) {
  const content = formData.get('content')
  if (typeof content !== 'string') return { error: 'Invalid content' }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_bio', { content }, createSupabaseActionContext(supabaseAdmin))
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
