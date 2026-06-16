import { useState, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadSimple, FolderOpen, X, PencilSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { MediaFile } from '@/lib/types'
import { useLocale } from '@/contexts/LocaleContext'
import { formatFileCount } from '@/lib/i18n'
import { FileCard, HudCorner } from '@/components/media/media-helpers'
import { MediaPreview } from '@/components/media/MediaPreview'
import { MediaUpload } from '@/components/media/MediaUpload'

interface MediaBrowserProps {
  mediaFiles?: MediaFile[]
  editMode?: boolean
  onUpdate?: (files: MediaFile[]) => void
  isOverlay?: boolean
  onClose?: () => void
}

export function MediaBrowser({ mediaFiles = [], editMode = false, onUpdate, isOverlay = false, onClose }: MediaBrowserProps) {
  const [overlayFile, setOverlayFile] = useState<MediaFile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const { t, locale } = useLocale()

  useEffect(() => {
    if (isOverlay && editMode && onUpdate && mediaFiles.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditOpen(true)
    }
  }, [isOverlay, editMode, onUpdate, mediaFiles.length])

  const handleOpen = (file: MediaFile) => {
    setOverlayFile(file)
  }

  const folderMap: Record<string, MediaFile[]> = {}
  const rootFiles: MediaFile[] = []
  for (const file of mediaFiles) {
    if (file.folder) {
      if (!folderMap[file.folder]) folderMap[file.folder] = []
      folderMap[file.folder].push(file)
    } else {
      rootFiles.push(file)
    }
  }
  const folders = Object.keys(folderMap)

  if (isOverlay) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: 'var(--z-overlay)' } as React.CSSProperties}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-3xl bg-card border border-primary/30 flex flex-col max-h-[90dvh]"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <HudCorner pos="tl" />
          <HudCorner pos="tr" />
          <HudCorner pos="bl" />
          <HudCorner pos="br" />

          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="data-label">// MEDIA.ARCHIVE</div>
            <div className="flex items-center gap-2">
              {editMode && onUpdate && (
                <Button
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="gap-1 font-mono text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <PencilSimple className="w-3 h-3" />
                  MANAGE FILES
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close media archive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {mediaFiles.length === 0 ? (
              <p className="text-xs font-mono text-foreground/30 text-center py-12">
                {editMode ? 'NO FILES — CLICK "MANAGE FILES" TO ADD' : 'NO FILES AVAILABLE'}
              </p>
            ) : (
              <div className="space-y-6">
                {rootFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rootFiles.map(file => (
                      <FileCard key={file.id} file={file} onClick={() => handleOpen(file)} />
                    ))}
                  </div>
                )}
                {folders.map(folder => (
                  <div key={folder}>
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="w-4 h-4 text-accent/60" />
                      <span className="data-label">// {folder.toUpperCase()}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l border-border/30">
                      {folderMap[folder].map(file => (
                        <FileCard key={file.id} file={file} onClick={() => handleOpen(file)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>{overlayFile && <MediaPreview file={overlayFile} onClose={() => setOverlayFile(null)} />}</AnimatePresence>

        <AnimatePresence>
          {editOpen && onUpdate && <MediaUpload files={mediaFiles} onSave={onUpdate} onClose={() => setEditOpen(false)} />}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <section id="media" className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-foreground font-mono hover-chromatic hover-glitch cyber2077-scan-build" data-text="MEDIA">
              MEDIA
            </h2>
            {editMode && onUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="gap-2 border-primary/30 font-mono tracking-wider text-xs shrink-0"
              >
                <PencilSimple className="w-4 h-4" />
                MANAGE FILES
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="relative border border-primary/30 bg-card/40 p-6 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
          whileHover={{ scale: 1.005 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <HudCorner pos="tl" />
          <HudCorner pos="tr" />
          <HudCorner pos="bl" />
          <HudCorner pos="br" />

          <div className="flex items-center justify-between">
            <div className="font-mono">
              <div className="data-label mb-1">{t('media.pressKits')}</div>
              <div className="text-foreground/50 text-sm tracking-wider">
                {mediaFiles.length === 0 ? t('media.noFiles') : formatFileCount(mediaFiles.length, locale)}
              </div>
            </div>
            <DownloadSimple className="w-6 h-6 text-accent/50 group-hover:text-accent transition-colors" />
          </div>
        </motion.div>

        {mediaFiles.length > 0 && (
          <motion.div className="mt-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {rootFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rootFiles.map(file => (
                  <FileCard key={file.id} file={file} onClick={() => handleOpen(file)} />
                ))}
              </div>
            )}
            {folders.map(folder => (
              <div key={folder}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-accent/60" />
                  <span className="data-label">// {folder.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l border-border/30">
                  {folderMap[folder].map(file => (
                    <FileCard key={file.id} file={file} onClick={() => handleOpen(file)} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>{overlayFile && <MediaPreview file={overlayFile} onClose={() => setOverlayFile(null)} />}</AnimatePresence>

      <AnimatePresence>
        {editOpen && onUpdate && <MediaUpload files={mediaFiles} onSave={onUpdate} onClose={() => setEditOpen(false)} />}
      </AnimatePresence>
    </section>
  )
}
