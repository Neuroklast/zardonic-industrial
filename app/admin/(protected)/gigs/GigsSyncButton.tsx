'use client'

import Link from 'next/link'
import { ArrowsClockwise } from '@phosphor-icons/react'

export function GigsSyncButton() {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
      <p className="text-sm text-zinc-400">
        Event imports and Bandsintown sync run in Catalogue Sync with live progress.
      </p>
      <Link
        href="/admin/releases/sync#events"
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-900/70 hover:bg-emerald-800 text-white text-sm font-medium transition-colors min-h-[44px]"
      >
        <ArrowsClockwise className="h-4 w-4" aria-hidden />
        Open event sync
      </Link>
    </div>
  )
}