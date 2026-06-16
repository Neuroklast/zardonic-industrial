import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { MediaFile } from '@/lib/types'
import { FileTypeIcon, HudCorner, isDriveUrl } from '@/components/media/media-helpers'

export function MediaUpload({
  files,
  onSave,
  onClose,
}: {
  files: MediaFile[]
  onSave: (files: MediaFile[]) => void
  onClose: () => void
}) {
  const [localFiles, setLocalFiles] = useState<MediaFile[]>(files)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState<MediaFile>({ id: '', name: '', url: '', type: 'download' })
  const inputRef = useRef<HTMLInputElement>(null)

  const genId = () => (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2))

  const startEdit = (idx: number) => {
    setEditIdx(idx)
    setDraft({ ...localFiles[idx] })
  }

  const startAdd = () => {
    const newFile: MediaFile = { id: genId(), name: '', url: '', type: 'download' }
    const next = [...localFiles, newFile]
    setLocalFiles(next)
    setEditIdx(next.length - 1)
    setDraft(newFile)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const saveEdit = () => {
    if (editIdx === null) return
    const updated = localFiles.map((file, index) => (index === editIdx ? { ...draft, id: draft.id || genId() } : file))
    setLocalFiles(updated)
    setEditIdx(null)
  }

  const removeFile = (idx: number) => {
    const next = localFiles.filter((_, i) => i !== idx)
    setLocalFiles(next)
    if (editIdx === idx) setEditIdx(null)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-overlay)' } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-card border border-primary/30 flex flex-col max-h-[90dvh]"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <HudCorner pos="tl" />
        <HudCorner pos="tr" />
        <HudCorner pos="bl" />
        <HudCorner pos="br" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="data-label">// MEDIA.MANAGER</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {localFiles.length === 0 && (
            <p className="text-xs font-mono text-foreground/30 text-center py-8">NO FILES — ADD ONE BELOW</p>
          )}
          {localFiles.map((file, idx) => (
            <div key={file.id || idx} className="border border-border/50 bg-background/40">
              {editIdx === idx ? (
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={draft.name}
                      onChange={e => setDraft(current => ({ ...current, name: e.target.value }))}
                      placeholder="File name"
                      className="flex-1 bg-transparent border border-primary/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                    />
                    <select
                      value={draft.type ?? 'download'}
                      onChange={e => setDraft(current => ({ ...current, type: e.target.value as MediaFile['type'] }))}
                      className="bg-card border border-primary/30 px-2 py-1 text-xs font-mono focus:outline-none"
                    >
                      <option value="download">Download</option>
                      <option value="audio">Audio</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={draft.url}
                      onChange={e => setDraft(current => ({ ...current, url: e.target.value }))}
                      placeholder="URL (or Google Drive share link)"
                      className="flex-1 bg-transparent border border-primary/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={draft.description ?? ''}
                      onChange={e => setDraft(current => ({ ...current, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="flex-1 bg-transparent border border-primary/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                    />
                    <input
                      value={draft.folder ?? ''}
                      onChange={e => setDraft(current => ({ ...current, folder: e.target.value }))}
                      placeholder="Folder (optional)"
                      className="w-28 bg-transparent border border-primary/30 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  {isDriveUrl(draft.url) && (
                    <p className="text-[10px] font-mono text-accent/60">✓ Google Drive URL detected — will download directly</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={saveEdit} className="font-mono text-xs gap-1">
                      <Check className="w-3 h-3" /> SAVE
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditIdx(null)} className="font-mono text-xs">
                      CANCEL
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2">
                  <FileTypeIcon type={file.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold truncate">{file.name || '(unnamed)'}</div>
                    <div className="text-[10px] text-foreground/40 font-mono truncate">{file.url || 'no url'}</div>
                    {file.folder && <div className="text-[10px] text-accent/50 font-mono">{file.folder}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(idx)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Edit file">
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeFile(idx)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove file">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
          <Button size="sm" variant="outline" onClick={startAdd} className="font-mono text-xs gap-2 border-primary/30 hover:border-primary">
            <Plus className="w-4 h-4" /> ADD FILE
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose} className="font-mono text-xs">
              CANCEL
            </Button>
            <Button size="sm" variant="default" onClick={() => { onSave(localFiles); onClose() }} className="font-mono text-xs">
              SAVE ALL
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
