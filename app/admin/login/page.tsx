import { Suspense } from 'react'

// LoginForm is a client component only to access useSearchParams (required by Next.js).
// The actual sign-in is performed via a native HTML form POST to /admin/login/submit
// so that the server can set auth cookies on the same redirect response — eliminating
// the browser-cookie propagation race that caused the redirect loop.
import LoginForm from './_components/LoginForm'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

