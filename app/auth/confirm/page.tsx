import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function RecoveryConfirmation({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const query = await searchParams
  const tokenHash = query.type === 'recovery' && typeof query.token_hash === 'string'
    && query.token_hash.length <= 2048 ? query.token_hash : null

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-bold">Confirm password reset</h1>
        {tokenHash ? (
          <>
            <p className="text-sm text-zinc-400">Continue to change your Zardonic CMS password.</p>
            <form method="POST" action="/auth/confirm/verify">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <button type="submit" className="w-full rounded bg-zinc-700 p-3 text-sm hover:bg-zinc-600">
                Continue password reset
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-red-300">This reset link is invalid or incomplete.</p>
        )}
        <Link href="/admin/forgot-password" className="block text-sm text-zinc-400 underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    </main>
  )
}
