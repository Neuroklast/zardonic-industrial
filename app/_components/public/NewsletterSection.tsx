'use client'

import { useActionState } from 'react'
import { formatSectionHeading } from '@/lib/section-display'
import { SectionWrapper, SectionHeading, SectionIntro } from './SectionWrapper'
import { subscribeNewsletter } from '@/app/_actions/newsletter'
import { useLocale } from '@/contexts/LocaleContext'

interface NewsletterSectionProps {
  heading?: string
  intro?: string
  body: string
  privacyPolicyUrl?: string
}

export function NewsletterSection({ heading, intro, body, privacyPolicyUrl = '/privacy-policy' }: NewsletterSectionProps) {
  const { t } = useLocale()
  const [state, formAction, pending] = useActionState(subscribeNewsletter, null)
  const title = formatSectionHeading(heading, 'newsletter')

  return (
    <SectionWrapper id="newsletter" data-theme-color="foreground card border input">
      <SectionHeading sectionId="newsletter" dataText={title}>{title}</SectionHeading>
      <SectionIntro sectionId="newsletter">{intro}</SectionIntro>

      <p className="mb-6 font-mono text-sm text-muted-foreground" data-draft-target="newsletter-body">
        {body}
      </p>

      {state?.success ? (
        <p className="border border-border px-4 py-3 font-mono text-sm text-foreground">
          {state.pending ? t('newsletter.pendingConfirm') : t('newsletter.success')}
        </p>
      ) : (
        <form action={formAction} className="flex w-full flex-col gap-4">
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder={t('newsletter.placeholder')}
              className="min-h-[44px] flex-1 border border-border bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none"
              aria-label="Email address"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={pending}
              className="min-h-[44px] shrink-0 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50 sm:px-6"
            >
              {pending ? '…' : t('newsletter.subscribe')}
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
              {t('newsletter.consentPrefix')}{' '}
              <a
                href={privacyPolicyUrl}
                className="text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                {t('newsletter.consentLink')}
              </a>
              .
            </span>
          </label>
          <p className="font-mono text-xs text-muted-foreground">{t('newsletter.unsubscribe')}</p>
          {state?.error ? (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          ) : null}
        </form>
      )}
    </SectionWrapper>
  )
}