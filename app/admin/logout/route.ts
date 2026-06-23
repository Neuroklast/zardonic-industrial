import { redirect } from 'next/navigation'
import { createActionClient } from '@/lib/supabaseServer'

async function handleLogout() {
  const supabase = await createActionClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export const GET = handleLogout
export const POST = handleLogout
