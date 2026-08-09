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

  // Footer / chrome only — not in the main navbar
  return (
    <label className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {t('nav.language')}
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="min-h-[40px] cursor-pointer border border-border/40 bg-transparent px-2 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        aria-label={t('nav.language')}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
