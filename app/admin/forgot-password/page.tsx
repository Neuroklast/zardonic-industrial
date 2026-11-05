import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const query = await searchParams
  const sent = query.sent === '1'
  const error = query.error

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="mt-2 text-sm text-zinc-400">Enter the email address associated with your Zardonic CMS account.</p>
        </div>
        {sent ? (
          <p role="status" className="rounded border border-zinc-700 p-3 text-sm">
            If an account exists for this email address, you will receive a password reset link.
          </p>
        ) : (
          <form method="POST" action="/admin/forgot-password/submit" className="space-y-4">
            <label className="block text-sm" htmlFor="recovery-email">Email address</label>
            <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254}
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-base" />
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error === 'rate' ? 'Too many attempts. Try again later.' : error === 'config'
                  ? 'Password recovery is unavailable due to configuration.'
                  : 'Unable to request a reset. Please try again.'}
              </p>
            )}
            <button type="submit" className="w-full rounded bg-zinc-700 p-3 text-sm hover:bg-zinc-600">
              Email reset link
            </button>
          </form>
        )}
        <Link href="/admin/login" className="block text-sm text-zinc-400 underline underline-offset-4">Return to admin login</Link>
      </div>
    </main>
  )
}
