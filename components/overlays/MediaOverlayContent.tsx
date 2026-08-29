'use client'

import { DownloadSimple } from '@phosphor-icons/react'
import type { MediaOverlayData } from '@/lib/app-types'
import { toDirectImageUrl } from '@/lib/image-cache'
import { useLocale } from '@/contexts/LocaleContext'

interface MediaOverlayContentProps {
  data: MediaOverlayData
}

export function MediaOverlayContent({ data }: MediaOverlayContentProps) {
  const { t } = useLocale()
  const previewSrc = toDirectImageUrl(data.imageUrl, { w: 1600, q: 85 }) || data.imageUrl

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden border border-border bg-muted">
        <img
          src={previewSrc}
          alt={data.title}
          className="mx-auto max-h-[min(70vh,720px)] w-auto max-w-full object-contain"
        />
      </div>
      <div className="space-y-2">
        <h2 className="font-mono text-xl font-bold uppercase tracking-tight">{data.title}</h2>
        {data.description ? (
          <p className="font-mono text-sm text-muted-foreground">{data.description}</p>
        ) : null}
      </div>
      <a
        href={data.fileUrl}
        download={data.filename ?? undefined}
        className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]"
      >
        <DownloadSimple className="h-4 w-4" />
        {t('media.download')}
      </a>
    </div>
  )
}
