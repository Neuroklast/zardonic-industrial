/**
 * Shared section wrapper for the public homepage.
 * Matches legacy SectionBase spacing with a readable content panel.
 */
interface SectionWrapperProps {
  id: string
  heading?: string
  children: React.ReactNode
  className?: string
  /** When false, children render without the frosted card panel. */
  withPanel?: boolean
}

export function SectionContentPanel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`cyber-grid surface-section-panel w-full p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  )
}

/** Large cyber-style section title — matches Bio, Gallery, Gigs, Releases. */
export function SectionHeading({
  children,
  dataText,
  className = '',
  sectionId,
  'data-draft-target': draftTarget,
}: {
  children: React.ReactNode
  dataText?: string
  className?: string
  sectionId?: string
  'data-draft-target'?: string
}) {
  const label = dataText ?? (typeof children === 'string' ? children : undefined)
  const target = draftTarget ?? (sectionId ? `section-heading-${sectionId}` : undefined)

  return (
    <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
      <h2
        className={`section-heading hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt text-heading font-bold uppercase tracking-tighter text-foreground ${className}`}
        data-text={label}
        data-draft-target={target}
      >
        {children}
        <span className="animate-pulse">_</span>
      </h2>
    </div>
  )
}

/** Optional subtitle below a section heading. */
export function SectionIntro({
  sectionId,
  children,
}: {
  sectionId: string
  children: React.ReactNode
}) {
  if (!children || (typeof children === 'string' && !children.trim())) return null

  return (
    <p
      className="-mt-8 mb-6 font-mono text-sm text-muted-foreground"
      data-draft-target={`section-intro-${sectionId}`}
    >
      {children}
    </p>
  )
}

export function SectionWrapper({
  id,
  heading,
  children,
  className = '',
  withPanel = true,
  ...rest
}: SectionWrapperProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      id={id}
      className={`relative w-full max-w-6xl mx-auto px-card py-section ${className}`}
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
      {...rest}
    >
      {heading ? (
        <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span className="mr-2 text-border">—</span>
          {heading}
        </h2>
      ) : null}
      {withPanel ? <SectionContentPanel>{children}</SectionContentPanel> : children}
    </section>
  )
}

/** Full-width border divider between sections */
export function SectionDivider() {
  return (
    <div
      className="w-full max-w-6xl mx-auto px-card"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
      aria-hidden="true"
    >
      <hr className="surface-section-divider border-t" />
    </div>
  )
}

/** Shared empty state for uniform coming-soon states (DRY) */
export function SectionEmpty({ label = 'Coming soon' }: { label?: string }) {
  return (
    <div className="surface-card border border-border p-12 text-center font-mono text-xl uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  )
}