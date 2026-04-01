/**
 * DraftPublishToggle — shows draft/published state and provides publish/unpublish button.
 */

import { usePublish } from '../hooks/useCmsApi'
import { toast } from 'sonner'

interface Props {
  entity: string
  id: string
  isDraft: boolean
  onSuccess?: () => void
}

export function DraftPublishToggle({ entity, id, isDraft, onSuccess }: Props) {
  const { mutateAsync, isPending } = usePublish()

  async function handleToggle() {
    try {
      await mutateAsync({ entity, id, action: isDraft ? 'publish' : 'unpublish' })
      toast.success(isDraft ? 'Veröffentlicht!' : 'Als Entwurf gespeichert')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Veröffentlichen')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`px-2 py-0.5 text-xs font-mono border ${isDraft ? 'border-zinc-600 text-zinc-400' : 'border-green-600 text-green-400'}`}>
        {isDraft ? 'ENTWURF' : 'VERÖFFENTLICHT'}
      </span>
      <button
        onClick={() => { void handleToggle() }}
        disabled={isPending}
        className={`px-3 py-1 text-xs font-mono border transition-colors disabled:opacity-50 ${
          isDraft
            ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
            : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        {isPending ? '…' : isDraft ? 'VERÖFFENTLICHEN' : 'ALS ENTWURF SPEICHERN'}
      </button>
    </div>
  )
}
