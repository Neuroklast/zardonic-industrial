'use client'

import { useState } from 'react'

export function RemoveMcpClientButton({ clientId, name, removeAction }: {
  clientId: string
  name: string
  removeAction: (formData: FormData) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  return <form action={removeAction} className="flex items-center gap-2">
    <input type="hidden" name="client_id" value={clientId} />
    {!confirming ? (
      <button type="button" onClick={() => setConfirming(true)}
        className="rounded border border-red-800 px-3 py-2 text-sm text-red-300">
        Delete
      </button>
    ) : (
      <>
        <span className="text-xs text-red-300" role="status">Remove {name}?</span>
        <button type="submit" className="rounded bg-red-950 px-3 py-2 text-sm text-red-100">
          Delete permanently
        </button>
        <button type="button" onClick={() => setConfirming(false)}
          className="rounded border border-zinc-600 px-3 py-2 text-sm">Cancel</button>
      </>
    )}
  </form>
}
