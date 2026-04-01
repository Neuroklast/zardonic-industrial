/**
 * ConfirmDialog — a confirmation dialog for destructive actions.
 */

import * as AlertDialog from '@radix-ui/react-alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Löschen', onConfirm }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#111] border border-zinc-700 p-6 w-full max-w-md">
          <AlertDialog.Title className="text-white font-mono text-sm uppercase mb-2">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-zinc-400 text-sm mb-6">{description}</AlertDialog.Description>
          <div className="flex gap-3 justify-end">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-1.5 text-sm font-mono border border-zinc-600 text-zinc-400 hover:bg-zinc-800">
                Abbrechen
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className="px-4 py-1.5 text-sm font-mono border border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
