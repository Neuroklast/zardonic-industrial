import { SectionContentPanel } from './SectionWrapper'

interface BrowsePageShellProps {
  title: string
  streamLabel: string
  children: React.ReactNode
}

export function BrowsePageShell({ title, streamLabel, children }: BrowsePageShellProps) {
  return (
    <div
      className="relative w-full max-w-6xl mx-auto px-card py-section"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
    >
      <SectionContentPanel>
        <header className="mb-10">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {streamLabel}
          </p>
          <h1 className="hover-chromatic font-mono text-2xl font-bold uppercase tracking-tighter text-foreground sm:text-3xl md:text-4xl">
            {title}
          </h1>
        </header>
        {children}
      </SectionContentPanel>
    </div>
  )
}