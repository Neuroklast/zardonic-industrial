import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const query = await searchParams
  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-zinc-400">You must open a valid password reset link first.</p>
        <form method="POST" action="/admin/reset-password/submit" className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="new-password" className="block text-sm">New password</label>
            <input id="new-password" name="password" type="password" required minLength={12} maxLength={128}
              autoComplete="new-password" className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-base" />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="block text-sm">Confirm new password</label>
            <input id="confirm-password" name="confirm" type="password" required minLength={12} maxLength={128}
              autoComplete="new-password" className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-base" />
          </div>
          {query.error && (
            <p role="alert" className="text-sm text-red-300">
              {query.error === 'session' ? 'Your reset link is no longer valid. Request a new one.'
                : query.error === 'password' ? 'Passwords must match and contain at least 12 characters.'
                  : 'Unable to update the password. Please try again.'}
            </p>
          )}
          <button type="submit" className="w-full rounded bg-zinc-700 p-3 text-sm hover:bg-zinc-600">
            Update password
          </button>
        </form>
        <Link href="/admin/forgot-password" className="block text-sm text-zinc-400 underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    </main>
  )
}
