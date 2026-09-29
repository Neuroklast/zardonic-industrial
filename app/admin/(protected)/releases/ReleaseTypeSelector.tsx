'use client'

import { useState, useTransition } from 'react'
import { updateReleaseType } from '@/app/admin/_actions/releases'
import {
  toQuickSelectReleaseType,
  type QuickSelectReleaseType,
} from '@/lib/release-type'

const TYPE_OPTIONS: Array<{ value: QuickSelectReleaseType; label: string }> = [
  { value: 'single', label: 'Single' },
  { value: 'remix', label: 'Remix' },
  { value: 'album', label: 'Album' },
  { value: 'compilation', label: 'Compilation' },
]

interface ReleaseTypeSelectorProps {
  releaseId: string
  type: string
}

/**
 * Four mutually exclusive type buttons for one release. Clicking sets the type
 * immediately (radio semantics) so the whole discography can be walked quickly.
 */
export function ReleaseTypeSelector({ releaseId, type }: ReleaseTypeSelectorProps) {
  const [value, setValue] = useState<QuickSelectReleaseType | null>(() =>
    toQuickSelectReleaseType(type),
  )
  const [pendingValue, setPendingValue] = useState<QuickSelectReleaseType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function choose(next: QuickSelectReleaseType) {
    if (next === value || pendingValue) return

    const previous = value
    setValue(next)
    setPendingValue(next)
    setError(null)

    startTransition(async () => {
      const result = await updateReleaseType(releaseId, next)
      if ('error' in result) {
        setValue(previous)
        setError(result.error)
      }
      setPendingValue(null)
    })
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Release type"
        className="inline-flex overflow-hidden rounded border border-zinc-700"
      >
        {TYPE_OPTIONS.map((option) => {
          const active = value === option.value
          const busy = pendingValue === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pendingValue !== null}
              onClick={() => choose(option.value)}
              className={`px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors disabled:opacity-60 ${
                active
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              } ${busy ? 'animate-pulse' : ''}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-1 text-[11px] text-red-400">{error}</p> : null}
    </div>
  )
}
