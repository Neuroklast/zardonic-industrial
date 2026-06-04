/**
 * SectionBase — canonical wrapper for every page section.
 *
 * Enforces the required structure:
 *   <div style={{ order }}>
 *     <Separator />
 *     <section id className="py-24 px-4 scanline-effect" data-theme-color>
 *       {children}
 *     </section>
 *   </div>
 *
 * Use this component instead of duplicating this boilerplate in each section.
 */

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SectionBaseProps {
  /** Value of the section's HTML `id` attribute (used for anchor navigation). */
  id: string
  /** CSS `order` value that controls visual position on the page. */
  sectionOrder: number
  /** When `false` the component renders nothing. */
  visible: boolean
  /**
   * Space-separated list of semantic color roles that the theme engine uses
   * to tint this section (e.g. `"foreground card border primary"`).
   */
  themeColor?: string
  /** Additional CSS classes applied to the inner `<section>` element. */
  className?: string
  children: React.ReactNode
}

/**
 * Canonical section wrapper.  All page sections should use this instead of
 * the raw `<div> → <Separator> → <section>` boilerplate.
 */
export function SectionBase({
  id,
  sectionOrder,
  visible,
  themeColor,
  className,
  children,
}: SectionBaseProps) {
  if (!visible) return null

  return (
    <div style={{ order: sectionOrder }}>
      <Separator className="bg-border" />
      <section
        id={id}
        className={cn('py-section px-card scanline-effect', className)}
        {...(themeColor ? { 'data-theme-color': themeColor } : {})}
      >
        {children}
      </section>
    </div>
  )
}
