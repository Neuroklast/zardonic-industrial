'use client'

import { useActionState } from 'react'
import { SectionWrapper, SectionHeading } from './SectionWrapper'
import { subscribeNewsletter } from '@/app/_actions/newsletter'

interface NewsletterSectionProps {
  heading: string
  body: string
  privacyPolicyUrl?: string
}

export function NewsletterSection({ heading, body, privacyPolicyUrl = '/privacy-policy' }: NewsletterSectionProps) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, null)
  const sectionTitle = heading.trim() || 'STAY CONNECTED'

  return (
    <SectionWrapper id="newsletter" data-theme-color="foreground card border input">
      <SectionHeading dataText={sectionTitle.toUpperCase()}>{sectionTitle.toUpperCase()}</SectionHeading>

      <p className="mb-6 font-mono text-sm text-muted-foreground">{body}</p>

      {state?.success ? (
        <p className="border border-border px-4 py-3 font-mono text-sm text-foreground">
          You&apos;re subscribed. Thank you.
        </p>
      ) : (
        <form action={formAction} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              className="min-h-[44px] flex-1 border border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none"
              aria-label="Email address"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={pending}
              className="min-h-[44px] shrink-0 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50 sm:px-6"
            >
              {pending ? '…' : 'Subscribe'}
            </button>
          </div>
          <label htmlFor="newsletter-consent" className="flex cursor-pointer items-start gap-2">
            <input
              id="newsletter-consent"
              name="consent_given"
              type="checkbox"
              value="true"
              required
              className="mt-1 min-h-[16px] min-w-[16px] accent-primary"
            />
            <span className="font-mono text-xs text-muted-foreground">
              I agree to receive emails and accept the{' '}
              <a
                href={privacyPolicyUrl}
                className="text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                privacy policy
              </a>
              .
            </span>
          </label>
          {state?.error ? (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          ) : null}
        </form>
      )}
    </SectionWrapper>
  )
}