/**
 * AutoSaveIndicator — shows the current auto-save status.
 */

import type { AutoSaveStatus } from '../hooks/useAutoSave'

interface Props {
  status: AutoSaveStatus
}

export function AutoSaveIndicator({ status }: Props) {
  const labels: Record<AutoSaveStatus, string> = {
    idle: '',
    saving: 'Speichert…',
    saved: 'Alle Änderungen gespeichert',
    error: 'Fehler beim Speichern',
  }

  const colors: Record<AutoSaveStatus, string> = {
    idle: 'text-zinc-600',
    saving: 'text-zinc-400',
    saved: 'text-green-500',
    error: 'text-red-500',
  }

  if (status === 'idle') return null

  return (
    <span className={`text-xs font-mono transition-all ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}
