'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { enrichReleaseTracks } from '@/app/admin/_actions/releaseTrackEnrichment'

interface ReloadTracklistButtonProps {
  releaseId: string
  disabled?: boolean
}

export function ReloadTracklistButton({ releaseId, disabled }: ReloadTracklistButtonProps) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    setMessage(null)
    setError(null)

    startTransition(async () => {
      const result = await enrichReleaseTracks(releaseId, { force: true })
      if (!result.ok) {
        setError(result.error ?? 'Failed to reload tracklist')
        return
      }

      if (!result.enriched) {
        setMessage('No changes — no external IDs or streaming links to look up, or APIs returned no data.')
        return
      }

      const parts = []
      if (result.trackCount) {
        parts.push(`${result.trackCount} tracks from ${result.source ?? 'external API'}`)
      }
      if (result.platformCount) {
        parts.push(`${result.platformCount} streaming platforms via Odesli`)
      }
      setMessage(parts.length > 0 ? `Loaded ${parts.join(' · ')}.` : 'Release enriched.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        className="inline-flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors disabled:opacity-50 min-h-[44px]"
      >
        <ArrowsClockwise className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
        {pending ? 'Loading tracklist…' : 'Reload tracklist'}
      </button>
      {message && <p className="text-xs text-green-400">{message}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}