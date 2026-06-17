import { motion } from 'framer-motion'
import { ArrowSquareOut, DownloadSimple, X } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { MediaFile } from '@/lib/types'
import { getDownloadHref, HudCorner, isYoutubeUrl } from '@/components/media/media-helpers'

export function MediaPreview({ file, onClose }: { file: MediaFile; onClose: () => void }) {
  const downloadHref = getDownloadHref(file.url)
  const isYoutube = file.type === 'youtube' || isYoutubeUrl(file.url)
  const isAudio = file.type === 'audio' || file.url.match(/\.(mp3|ogg|wav|flac)(\?.*)?$/i)

  return (
    <motion.div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-overlay)' } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-card border border-primary/30 p-6 font-mono"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <HudCorner pos="tl" />
        <HudCorner pos="tr" />
        <HudCorner pos="bl" />
        <HudCorner pos="br" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="data-label mb-1">// FILE.SELECTED</div>
            <h3 className="text-lg font-bold tracking-wider uppercase">{file.name}</h3>
            {file.description && <p className="text-xs text-foreground/50 mt-1">{file.description}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isYoutube && (
          <div className="aspect-video mb-4 bg-black">
            <iframe
              src={file.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube-nocookie.com/embed/')}
              title={file.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
              className="w-full h-full"
            />
          </div>
        )}

        {isAudio && <audio controls src={file.url} className="w-full mb-4" />}

        <div className="flex gap-3 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-mono text-xs gap-2 border-primary/30 hover:border-primary"
          >
            <a href={downloadHref} target="_blank" rel="noopener noreferrer" download>
              <DownloadSimple className="w-4 h-4" />
              DOWNLOAD
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="font-mono text-xs gap-2">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut className="w-4 h-4" />
              OPEN IN NEW TAB
            </a>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
