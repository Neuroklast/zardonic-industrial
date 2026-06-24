'use client'

import Link from 'next/link'
import { ArrowsClockwise } from '@phosphor-icons/react'

export function DataMaintenanceClient() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <ArrowsClockwise className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-white">Catalogue sync & enrichment</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Imports, track enrichment, event syncs, and purge operations now live in one place with a
            shared progress bar.
          </p>
          <Link
            href="/admin/releases/sync"
            className="inline-flex mt-3 px-4 py-2 text-sm rounded bg-red-900/80 hover:bg-red-800 text-white font-medium transition-colors min-h-[44px] items-center"
          >
            Open Catalogue Sync →
          </Link>
        </div>
      </div>
    </div>
  )
}