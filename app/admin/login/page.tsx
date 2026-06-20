import { Suspense } from 'react'

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
