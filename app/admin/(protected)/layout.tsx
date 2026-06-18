import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { AdminNav } from '@/app/admin/_components/AdminNav'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as { role?: string }).role !== 'admin') {
    redirect('/admin/login?error=forbidden')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 p-4 pt-16 md:p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}
