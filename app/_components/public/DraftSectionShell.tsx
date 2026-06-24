import type { ReactNode, CSSProperties } from 'react'

interface DraftSectionShellProps {
  sectionId: string
  order: number
  visible: boolean
  children: ReactNode
}

/** Wraps a homepage section for admin live-preview reordering and visibility toggles. */
export function DraftSectionShell({ sectionId, order, visible, children }: DraftSectionShellProps) {
  const style: CSSProperties = {
    order,
    display: visible ? undefined : 'none',
  }

  return (
    <div data-draft-section={sectionId} style={style}>
      {children}
    </div>
  )
}