export function AdminHeader() {
  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <h1 className="text-sm font-medium text-zinc-200">Zardonic Admin</h1>
      <form action="/admin/logout" method="POST">
        <button
          type="submit"
          className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1 rounded border border-zinc-700 hover:border-zinc-500"
        >
          Sign out
        </button>
      </form>
    </header>
  )
}
