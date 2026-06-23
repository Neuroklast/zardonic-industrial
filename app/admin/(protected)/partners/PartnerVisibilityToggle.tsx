'use client'

import { useState, useTransition } from 'react'
import { togglePartnerVisibility } from '@/app/admin/_actions/partners'

interface PartnerVisibilityToggleProps {
  partnerId: string
  active: boolean
}

export function PartnerVisibilityToggle({ partnerId, active: initialActive }: PartnerVisibilityToggleProps) {
  const [active, setActive] = useState(initialActive)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !active
    setActive(next)
    startTransition(async () => {
      const result = await togglePartnerVisibility(partnerId, next)
      if (result?.error) setActive(!next)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={active ? 'Hide on site' : 'Show on site'}
      className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
        active
          ? 'border-green-700/50 text-green-400'
          : 'border-zinc-700 text-zinc-500'
      }`}
    >
      {active ? 'Visible' : 'Hidden'}
    </button>
  )
}