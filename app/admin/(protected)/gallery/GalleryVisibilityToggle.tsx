'use client'

import { useState, useTransition } from 'react'
import { toggleGalleryImageVisibility } from '@/app/admin/_actions/gallery'

interface GalleryVisibilityToggleProps {
  imageId: string
  active: boolean
}

export function GalleryVisibilityToggle({ imageId, active: initialActive }: GalleryVisibilityToggleProps) {
  const [active, setActive] = useState(initialActive)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !active
    setActive(next)
    startTransition(async () => {
      const result = await toggleGalleryImageVisibility(imageId, next)
      if (result?.error) setActive(!next)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-label={active ? 'Hide image on site' : 'Show image on site'}
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