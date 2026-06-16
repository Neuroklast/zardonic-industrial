import { AdminNav } from '@/app/admin/_components/AdminNav'
import { AdminHeader } from '@/app/admin/_components/AdminHeader'

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
