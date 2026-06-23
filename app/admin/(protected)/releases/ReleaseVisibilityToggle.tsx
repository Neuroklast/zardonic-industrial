'use client'

import { useState, useTransition } from 'react'
import { toggleReleaseVisibility } from '@/app/admin/_actions/releases'

interface ReleaseVisibilityToggleProps {
  releaseId: string
  active: boolean
}

export function ReleaseVisibilityToggle({ releaseId, active: initialActive }: ReleaseVisibilityToggleProps) {
  const [active, setActive] = useState(initialActive)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !active
    setActive(next)
    startTransition(async () => {
      const result = await toggleReleaseVisibility(releaseId, next)
      if (result?.error) setActive(!next)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={active ? 'Hide release on site' : 'Show release on site'}
      className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
        active
          ? 'border-green-700/50 text-green-400 hover:border-green-600'
          : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {active ? 'Visible' : 'Hidden'}
    </button>
  )
}