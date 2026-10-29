'use client'

import { useState } from 'react'

export function CopyMcpAddress({ value }: { value: string }) {
  const [status, setStatus] = useState('')
  return <span className="inline-flex flex-wrap gap-2 items-center">
    <code className="select-all break-all rounded bg-zinc-950 p-2 text-xs">{value}</code>
    <button type="button" className="rounded border border-zinc-600 px-3 py-2 text-xs" onClick={async () => {
      try { await navigator.clipboard.writeText(value); setStatus('Copied') }
      catch { setStatus('Please copy manually') }
    }}>Copy</button>
    <span role="status" className="text-xs text-zinc-400">{status}</span>
  </span>
}
