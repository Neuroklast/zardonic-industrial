interface HeroSectionProps {
  headline: string
  tagline: string
  ctaLabel: string
  ctaUrl: string
}

export function HeroSection({ headline, tagline, ctaLabel, ctaUrl }: HeroSectionProps) {
  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-4"
      style={{ zIndex: 'var(--z-content)' as React.CSSProperties['zIndex'] }}
    >
      <h1 className="font-mono font-bold text-5xl md:text-7xl tracking-[0.2em] text-white mb-4">
        {headline}
      </h1>
      <p className="font-mono text-sm tracking-widest text-zinc-400 uppercase mb-10 max-w-md">
        {tagline}
      </p>
      <a
        href={ctaUrl}
        className="font-mono text-xs tracking-widest uppercase border border-zinc-600 text-zinc-300 hover:border-white hover:text-white px-6 py-3 transition-colors"
      >
        {ctaLabel}
      </a>
    </section>
  )
}
