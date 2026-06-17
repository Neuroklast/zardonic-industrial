import { AdminNav } from '@/app/admin/_components/AdminNav'

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex flex-1">
        <AdminNav />
        {/* pt-14 on mobile offsets the sticky top nav bar (~56px) */}
        <main className="flex-1 p-4 pt-16 md:p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}
