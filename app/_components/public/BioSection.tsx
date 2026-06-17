import { SectionWrapper } from './SectionWrapper'

interface BioSectionProps {
  content: string
}

export function BioSection({ content }: BioSectionProps) {
  return (
    <SectionWrapper id="bio" heading="Biography">
      <div className="max-w-3xl">
        <p className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
          {content}
        </p>
      </div>
    </SectionWrapper>
  )
}
