'use client'

import { useActionState } from 'react'
import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionHeading, SectionIntro } from './SectionWrapper'
import { submitContact } from '@/app/_actions/contact'

const fieldClass =
  'min-h-[44px] w-full border border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none'

interface ContactSectionProps {
  heading?: string
  intro?: string
}

export function ContactSection({ heading, intro }: ContactSectionProps) {
  const [state, formAction, pending] = useActionState(submitContact, null)
  const title = formatSectionHeading(heading, 'contact')

  return (
    <SectionWrapper id="contact" data-theme-color="foreground card border input">
      <SectionHeading sectionId="contact" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="contact">{intro}</SectionIntro>

      {state?.success ? (
        <p className="border border-border px-4 py-3 font-mono text-sm text-foreground">
          Message sent. Thank you.
        </p>
      ) : (
        <form action={formAction} className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input id="contact-name" name="name" required className={fieldClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className={fieldClass}
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-subject" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Subject
            </label>
            <input id="contact-subject" name="subject" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              rows={5}
              className={`${fieldClass} min-h-[8rem] resize-none`}
            />
          </div>
          {state?.error ? (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          ) : null}
          <div>
            <button
              type="submit"
              disabled={pending}
              className="min-h-[44px] border border-border px-6 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </SectionWrapper>
  )
}