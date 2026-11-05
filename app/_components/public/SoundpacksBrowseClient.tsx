'use client'

import { useMemo, useState } from 'react'
import { browseSectionItems, type SectionBrowseSort } from '@/lib/section-browse'
import { paginateItems } from '@/lib/browse-pagination'
import { BrowseToolbar } from './BrowseToolbar'
import { BrowsePagination } from './BrowsePagination'
import { SectionBrowseSort } from './SectionBrowseSort'
import { SectionEmpty } from './SectionWrapper'
import { SquareImageGrid } from './SquareImageGrid'
import type { PublicSoundpackItem } from '@/lib/public-fetch'

export function SoundpacksBrowseClient({ items }: { items: PublicSoundpackItem[] }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SectionBrowseSort>('editorial')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => browseSectionItems(items, search, sort), [items, search, sort])
  const paged = paginateItems(filtered, page)

  return (
    <>
      <BrowseToolbar
        searchQuery={search}
        onSearchChange={(query) => { setSearch(query); setPage(1) }}
        searchPlaceholder="Search soundpacks…"
        resultCount={filtered.length}
      />
      <SectionBrowseSort value={sort} onChange={(value) => { setSort(value); setPage(1) }} />
      {paged.items.length ? (
        <SquareImageGrid items={paged.items} />
      ) : (
        <SectionEmpty label={items.length ? 'No matching soundpacks' : 'Soundpacks coming soon'} />
      )}
      <BrowsePagination currentPage={paged.currentPage} totalPages={paged.totalPages} onPageChange={setPage} />
    </>
  )
}
