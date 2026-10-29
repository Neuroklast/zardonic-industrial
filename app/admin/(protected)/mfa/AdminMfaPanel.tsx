'use client'

import Image from 'next/image'
import { useState } from 'react'
import { beginAdminMfaEnrollment, verifyAdminMfa } from '@/app/admin/_actions/mcpMfa'

type Enrollment = { factorId: string; qrCode: string; secret: string }

export default function AdminMfaPanel({
  verifiedFactorId,
  currentLevel,
  returnTo,
}: {
  verifiedFactorId: string | null
  currentLevel: string
  returnTo: string
}) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(currentLevel === 'aal2')

  async function beginEnrollment() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await beginAdminMfaEnrollment()
      if (result.success) setEnrollment(result)
      else setError(result.error)
    } catch {
      setError('Authenticator setup is unavailable.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const factorId = enrollment?.factorId ?? verifiedFactorId
    if (!factorId || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await verifyAdminMfa(factorId, code)
      if (result.success) {
        setCode('')
        setEnrollment(null)
        setVerified(true)
        window.location.assign(returnTo)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Authenticator verification is unavailable.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 rounded-lg border border-zinc-700 bg-zinc-900 p-6 text-zinc-200">
      <h1 className="text-xl font-semibold text-white">Admin two-factor authentication</h1>
      <p className="text-sm text-zinc-400">
        NEUROKLAST requires an authenticator app and a fresh six-digit code for
        OAuth consent and approval of AI content changes.
      </p>

      {verified ? (
        <div role="status" className="rounded border border-zinc-700 bg-zinc-950 p-3 text-sm">
          Your admin session is verified (AAL2).
          <a href={returnTo} className="ml-2 underline underline-offset-4">Continue</a>
        </div>
      ) : (
        <>
          {!verifiedFactorId && !enrollment && (
            <div className="space-y-3">
              <p className="text-sm">Set up a TOTP authenticator to protect this administrator account.</p>
              <button
                type="button"
                disabled={busy}
                onClick={beginEnrollment}
                className="rounded border border-red-800 bg-red-950 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-50"
              >
                {busy ? 'Starting…' : 'Set up authenticator'}
              </button>
            </div>
          )}

          {enrollment && (
            <div className="space-y-3">
              <p className="text-sm">Scan this QR code using your authenticator app.</p>
              <div className="w-fit rounded bg-white p-3">
                <Image
                  src={enrollment.qrCode}
                  width={210}
                  height={210}
                  alt="NEUROKLAST authenticator setup QR code"
                  unoptimized
                />
              </div>
              <p className="text-xs text-zinc-400">
                If scanning fails, enter this setup key manually. Keep it private.
              </p>
              <code className="block w-fit max-w-full select-all break-all rounded bg-zinc-950 p-3 text-xs text-zinc-100">
                {enrollment.secret}
              </code>
            </div>
          )}

          {(verifiedFactorId || enrollment) && (
            <form onSubmit={verifyCode} className="space-y-3">
              <label htmlFor="mfa-code" className="block text-sm">Six-digit authenticator code</label>
              <input
                id="mfa-code"
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                className="block w-full max-w-48 rounded border border-zinc-600 bg-zinc-950 px-3 py-2 font-mono tracking-widest text-white"
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="rounded bg-zinc-200 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {busy ? 'Verifying…' : 'Verify and continue'}
              </button>
            </form>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  )
}
