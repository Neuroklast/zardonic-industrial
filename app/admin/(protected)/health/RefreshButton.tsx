'use client'

import { useRouter } from 'next/navigation'
import { ArrowsClockwise } from '@phosphor-icons/react'

export function RefreshButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
      aria-label="Refresh health checks"
    >
      <ArrowsClockwise className="h-4 w-4" aria-hidden="true" />
      Refresh
    </button>
  )
}
