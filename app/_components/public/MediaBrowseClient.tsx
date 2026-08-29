'use client'

import { useMemo, useState } from 'react'
import CyberpunkOverlay from '@/components/CyberpunkOverlay'
import type { CyberpunkOverlayState } from '@/lib/app-types'
import { paginateItems } from '@/lib/browse-pagination'
import {
  MEDIA_CATEGORY_FILTERS,
  browseMediaDownloads,
  mediaKindFromMime,
  type MediaCategoryFilter,
  type MediaDownloadItem,
} from '@/lib/media-download'
import { toDirectImageUrl } from '@/lib/image-cache'
import { useLocale } from '@/contexts/LocaleContext'
import { BrowsePagination } from './BrowsePagination'
import { BrowseToolbar } from './BrowseToolbar'
import { SectionEmpty } from './SectionWrapper'
import { MediaDownloadGrid } from './MediaDownloadGrid'

interface MediaBrowseClientProps {
  items: MediaDownloadItem[]
}

const FILTER_I18N: Record<MediaCategoryFilter, string> = {
  all: 'media.categoryAll',
  photo: 'media.categoryPhoto',
  logo: 'media.categoryLogo',
  document: 'media.categoryDocument',
  audio: 'media.categoryAudio',
  other: 'media.categoryOther',
}

export function MediaBrowseClient({ items }: MediaBrowseClientProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MediaCategoryFilter>('all')
  const [page, setPage] = useState(1)
  const [overlay, setOverlay] = useState<CyberpunkOverlayState | null>(null)

  const filtered = useMemo(
    () => browseMediaDownloads(items, query, category),
    [items, query, category],
  )
  const paged = paginateItems(filtered, page)

  const filters = MEDIA_CATEGORY_FILTERS.map((filter) => ({
    value: filter.value,
    label: t(FILTER_I18N[filter.value]),
  }))

  function handleFilterChange(value: MediaCategoryFilter) {
    setCategory(value)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setQuery(value)
    setPage(1)
  }

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
      <BrowseToolbar
        searchQuery={query}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('media.searchPlaceholder')}
        filters={filters}
        activeFilter={category}
        onFilterChange={handleFilterChange}
        resultCount={filtered.length}
      />

      {paged.items.length > 0 ? (
        <MediaDownloadGrid items={paged.items} onImageClick={handleImageClick} />
      ) : (
        <SectionEmpty label={items.length === 0 ? t('media.empty') : t('media.noResults')} />
      )}

      <BrowsePagination
        currentPage={paged.currentPage}
        totalPages={paged.totalPages}
        onPageChange={setPage}
      />

      <CyberpunkOverlay overlay={overlay} onClose={() => setOverlay(null)} adminSettings={undefined} />
    </>
  )
}
