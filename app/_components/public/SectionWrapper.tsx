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
      className={`cyber-grid surface-section-panel w-full border border-border/60 p-6 md:p-8 ${className}`}
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
}: {
  children: React.ReactNode
  dataText?: string
  className?: string
}) {
  const label = dataText ?? (typeof children === 'string' ? children : undefined)

  return (
    <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
      <h2
        className={`hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-heading font-bold uppercase tracking-tighter text-foreground ${className}`}
        data-text={label}
      >
        {children}
        <span className="animate-pulse">_</span>
      </h2>
    </div>
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
      <hr className="border-border/60" />
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