'use client'

import { useTransition } from 'react'
import { deleteRelease } from '@/app/admin/_actions/releases'

interface DeleteReleaseButtonProps {
  releaseId: string
}

export function DeleteReleaseButton({ releaseId }: DeleteReleaseButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this release?')) return
    startTransition(async () => {
      await deleteRelease(releaseId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
