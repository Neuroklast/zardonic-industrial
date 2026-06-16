'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function updateBio(formData: FormData) {
  const content = formData.get('content')
  if (typeof content !== 'string') return { error: 'Invalid content' }

  const supabase = createAdminClient()

  // Get existing bio or create new one
  const { data: existing } = await supabase
    .from('bio')
    .select('id')
    .limit(1)
    .single()

  let error
  if (existing) {
    ;({ error } = await supabase
      .from('bio')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id))
  } else {
    ;({ error } = await supabase.from('bio').insert({ content }))
  }

  if (error) return { error: error.message }
  revalidatePath('/admin/bio')
  return { success: true }
}
