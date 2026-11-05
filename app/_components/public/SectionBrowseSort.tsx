'use client'

import { SECTION_BROWSE_SORT_OPTIONS, type SectionBrowseSort } from '@/lib/section-browse'

export function SectionBrowseSort({
  value,
  onChange,
}: {
  value: SectionBrowseSort
  onChange: (value: SectionBrowseSort) => void
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <label htmlFor="section-browse-sort" className="font-mono text-xs uppercase text-muted-foreground">
        Sort by
      </label>
      <select
        id="section-browse-sort"
        value={value}
        onChange={(event) => onChange(event.target.value as SectionBrowseSort)}
        className="min-h-[44px] border border-border bg-card px-3 font-mono text-xs text-foreground focus:border-primary/50 focus:outline-none"
      >
        {SECTION_BROWSE_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}
