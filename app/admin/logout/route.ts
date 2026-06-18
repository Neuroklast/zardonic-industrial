import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

async function handleLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export const GET = handleLogout
export const POST = handleLogout
