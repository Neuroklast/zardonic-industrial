import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { AdminNav } from '@/app/admin/_components/AdminNav'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    redirect('/admin/login?error=config')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
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
