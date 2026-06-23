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
      className={`cyber-grid border border-border/60 bg-card/55 backdrop-blur-sm p-6 md:p-8 ${className}`}
    >
      {children}
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
      className={`relative max-w-6xl mx-auto px-card py-section scanline-effect ${className}`}
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
      {...rest}
    >
      {heading ? (
        <h2 className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-8">
          <span className="text-zinc-600 mr-2">—</span>
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
      className="max-w-6xl mx-auto px-4"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
      aria-hidden="true"
    >
      <hr className="border-zinc-800/60" />
    </div>
  )
}

/** Shared empty state for uniform coming-soon states (DRY) */
export function SectionEmpty({ label = 'Coming soon' }: { label?: string }) {
  return (
    <div className="border border-border bg-card/50 p-12 text-center font-mono text-xl uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  )
}