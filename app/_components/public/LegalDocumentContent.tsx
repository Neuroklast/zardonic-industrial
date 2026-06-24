import type { LegalSection } from '@/lib/legal-content'

interface LegalDocumentContentProps {
  title: string
  streamLabel: string
  sections: LegalSection[]
  isCustom?: boolean
}

export function LegalDocumentContent({
  title,
  streamLabel,
  sections,
  isCustom = false,
}: LegalDocumentContentProps) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2">{streamLabel}</p>
        <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wide text-zinc-100">
          {title}
        </h1>
      </header>

      <div className="space-y-6 sm:space-y-8">
        {sections.map((section) => (
          <section
            key={section.id}
            className="border border-zinc-800/80 rounded-lg p-4 sm:p-6 bg-zinc-950/60"
          >
            {!isCustom && (
              <h2 className="font-mono text-sm sm:text-base font-bold text-red-500/90 uppercase tracking-wide mb-3 sm:mb-4">
                {section.title}
              </h2>
            )}
            <div className="space-y-3 font-mono text-sm leading-relaxed text-zinc-300 break-words">
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}