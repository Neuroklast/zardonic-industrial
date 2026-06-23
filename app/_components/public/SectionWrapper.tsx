/**
 * Shared section wrapper for the public homepage.
 * Provides consistent padding, a heading, and the section anchor id.
 * Sections are transparent – no individual backgrounds.
 */
interface SectionWrapperProps {
  id: string
  heading?: string
  children: React.ReactNode
  className?: string
}

export function SectionWrapper({ id, heading, children, className = '', ...rest }: SectionWrapperProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      id={id}
      className={`relative max-w-6xl mx-auto px-4 py-20 ${className}`}
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
      {...rest}
    >
      {heading ? (
        <h2 className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-8">
          <span className="text-zinc-600 mr-2">—</span>
          {heading}
        </h2>
      ) : null}
      {children}
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
