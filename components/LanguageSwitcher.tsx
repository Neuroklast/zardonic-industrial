'use client'

import { useLocale } from '@/contexts/LocaleContext'
import type { Locale } from '@/lib/i18n'

/**
 * Live language switcher for the public site.
 * Hidden when only one language is configured in admin.
 */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, languages, t } = useLocale()

  if (languages.length <= 1) return null

  return (
    <label className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="min-h-[44px] cursor-pointer rounded border border-border/50 bg-background/80 px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t('nav.language')}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code.toUpperCase()} · {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
