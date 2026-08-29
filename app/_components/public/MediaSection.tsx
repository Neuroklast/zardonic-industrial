'use client'

import { useState } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import { useLocale } from '@/contexts/LocaleContext'
import { resolveSectionHeading } from '@/lib/section-display'
import { HOMEPAGE_MEDIA_LIMIT, mediaKindFromMime, type MediaDownloadItem } from '@/lib/media-download'
import { toDirectImageUrl } from '@/lib/image-cache'
import { SectionWrapper, SectionEmpty, SectionHeading, SectionIntro } from './SectionWrapper'
import { MediaDownloadGrid } from './MediaDownloadGrid'

interface MediaSectionProps {
  items: MediaDownloadItem[]
  heading?: string
  intro?: string
}

export function MediaSection({ items, heading, intro }: MediaSectionProps) {
  const { t } = useLocale()
  const title = resolveSectionHeading(heading, 'media', t)
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)
  const visible = items.slice(0, HOMEPAGE_MEDIA_LIMIT)

  function handleImageClick(item: MediaDownloadItem) {
    if (!item.fileUrl || mediaKindFromMime(item.fileMime, item.originalFilename) !== 'image') return
    const preview = toDirectImageUrl(item.fileUrl, { w: 1600, q: 85 }) || item.fileUrl
    setOverlay({
      type: 'media',
      data: {
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: preview,
        fileUrl: item.fileUrl,
        filename: item.originalFilename,
      },
    })
  }

  return (
    <>
      <SectionWrapper id="media" data-theme-color="foreground card border primary">
        <SectionHeading sectionId="media" dataText={title}>
          {title}
        </SectionHeading>
        <SectionIntro sectionId="media">{intro}</SectionIntro>

        {items.length > 0 ? (
          <div className="space-y-8">
            <MediaDownloadGrid items={visible} onImageClick={handleImageClick} />
            {items.length > HOMEPAGE_MEDIA_LIMIT ? (
              <m.div initial={false} animate={{ opacity: 1 }} className="flex justify-center pt-2">
                <Link
                  href="/media"
                  className="cyber-border hover-glitch inline-flex min-h-[44px] items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]"
                >
                  {t('media.viewAll').replace('{0}', String(items.length))}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </m.div>
            ) : null}
          </div>
        ) : (
          <SectionEmpty label={t('media.empty')} />
        )}
      </SectionWrapper>

      <CyberpunkOverlay overlay={overlay} onClose={() => setOverlay(null)} adminSettings={undefined} />
    </>
  )
}
