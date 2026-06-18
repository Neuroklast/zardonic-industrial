'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { CaretDown, CaretUp } from '@phosphor-icons/react'

interface BioSectionProps {
  content: string
}

export function BioSection({ content }: BioSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = content.trim().length > 0
  const displayContent = hasContent ? content : 'Biography coming soon.'

  return (
    <section
      id="bio"
      className="scanline-effect py-section px-card"
      style={{ zIndex: 'var(--z-content)' }}
      data-theme-color="foreground muted-foreground card border"
    >
      <div className="container mx-auto max-w-6xl">
        <m.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <h2
              className="hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt font-mono text-4xl font-bold uppercase tracking-tighter text-foreground md:text-6xl"
              data-text="BIOGRAPHY"
            >
              BIOGRAPHY
              <span className="animate-pulse">_</span>
            </h2>
          </div>

          <div
            className={`overflow-hidden whitespace-pre-wrap font-light text-lg text-muted-foreground leading-relaxed ${expanded ? 'max-h-none' : 'max-h-[280px]'}`}
            style={{
              maskImage: expanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: expanded ? 'none' : 'linear-gradient(to bottom, black 60%, transparent 100%)',
              transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), mask-image 0.3s ease, -webkit-mask-image 0.3s ease',
            }}
          >
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {displayContent}
            </m.div>
          </div>

          {hasContent ? (
            <m.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="cyber-border hover-glitch inline-flex items-center gap-2 px-4 py-2 font-mono"
              >
                {expanded ? (
                  <>
                    <CaretUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <CaretDown className="h-4 w-4" />
                    Read More
                  </>
                )}
              </button>
            </m.div>
          ) : null}
        </m.div>
      </div>
    </section>
  )
}
