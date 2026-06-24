import { redirect } from 'next/navigation'
import { createActionClient } from '@/lib/supabaseServer'
import { AdminShell } from '@/app/admin/_components/AdminShell'
import { AdminHelpPalette } from '@/app/admin/_components/AdminHelpPalette'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await createActionClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/admin/login')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error // rethrow Next.js redirect
    }
    // E.g. Missing required Supabase environment variables
    redirect('/admin/login?error=config')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col" data-admin-ui="true">
      {/* Admin shell uses custom dark container (different from public PageLayout).
          Documented exception per AGENTS §6. All public pages use PageLayout. */}
      <AdminShell>{children}</AdminShell>
      <AdminHelpPalette />
    </div>
  )
}
