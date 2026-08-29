'use client'

import { m, useReducedMotion } from 'framer-motion'
import { DownloadSimple, FilePdf, FileZip, FileAudio, File as FileIcon } from '@phosphor-icons/react'
import { toDirectImageUrl } from '@/lib/image-cache'
import { useLocale } from '@/contexts/LocaleContext'
import {
  formatFileSize,
  mediaKindFromMime,
  type MediaDownloadItem,
} from '@/lib/media-download'

interface MediaDownloadGridProps {
  items: MediaDownloadItem[]
  onImageClick: (item: MediaDownloadItem) => void
}

function FileKindIcon({ kind, mime }: { kind: ReturnType<typeof mediaKindFromMime>; mime: string | null }) {
  if (kind === 'audio') return <FileAudio className="h-8 w-8 text-primary/70" />
  if (mime === 'application/pdf') return <FilePdf className="h-8 w-8 text-primary/70" />
  if (mime === 'application/zip') return <FileZip className="h-8 w-8 text-primary/70" />
  return <FileIcon className="h-8 w-8 text-primary/70" />
}

export function MediaDownloadGrid({ items, onImageClick }: MediaDownloadGridProps) {
  const { t } = useLocale()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item, index) => {
        const kind = mediaKindFromMime(item.fileMime, item.originalFilename)
        const sizeLabel = formatFileSize(item.fileSizeBytes)
        const thumb =
          kind === 'image' && item.fileUrl
            ? toDirectImageUrl(item.fileUrl, { w: 640, q: 75 }) || item.fileUrl
            : null

        return (
          <m.article
            key={item.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : Math.min(index * 0.04, 0.3),
            }}
            className="cyber-card hover-scan group relative border border-border bg-card/40 p-4"
          >
            {kind === 'image' && thumb ? (
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => onImageClick(item)}
                aria-label={`${t('media.preview')}: ${item.title}`}
              >
                <div className="relative mb-3 aspect-square overflow-hidden border border-border bg-muted">
                  <img
                    src={thumb}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wide hover-chromatic">
                  {item.title}
                </h3>
                {sizeLabel ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{sizeLabel}</p>
                ) : null}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileKindIcon kind={kind} mime={item.fileMime} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wide">{item.title}</h3>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 font-mono text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    {sizeLabel ? (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{sizeLabel}</p>
                    ) : null}
                  </div>
                </div>
                {kind === 'audio' && item.fileUrl ? (
                  <audio
                    controls
                    preload="none"
                    src={item.fileUrl}
                    className="w-full"
                    aria-label={item.title}
                  />
                ) : null}
                {item.fileUrl ? (
                  <a
                    href={item.fileUrl}
                    download={item.originalFilename ?? undefined}
                    className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em]"
                  >
                    <DownloadSimple className="h-4 w-4" />
                    {t('media.download')}
                  </a>
                ) : null}
              </div>
            )}
          </m.article>
        )
      })}
    </div>
  )
}
