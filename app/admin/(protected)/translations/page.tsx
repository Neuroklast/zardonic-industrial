import { createClient } from '@/lib/supabaseServer'
import { parseLanguagesConfig } from '@/lib/languages-config'
import type { SiteLanguage } from '@/lib/i18n'
import { parseTranslationsConfig } from '@/lib/translations-config'
import TranslationsEditor from './TranslationsEditor'

const DEFAULT_STRINGS: Record<string, Record<string, string>> = {
  'hero.cta': { en: 'Listen Now', de: 'Jetzt anhören' },
  'bio.readMore': { en: 'Read More', de: 'Mehr lesen' },
  'releases.filterAll': { en: 'All', de: 'Alle' },
  'gigs.upcoming': { en: 'Upcoming', de: 'Bevorstehend' },
  'gigs.past': { en: 'Past', de: 'Vergangen' },
  'gigs.noEvents': { en: 'No upcoming events.', de: 'Keine bevorstehenden Events.' },
  'newsletter.subscribe': { en: 'Subscribe', de: 'Abonnieren' },
  'newsletter.placeholder': { en: 'Your email address', de: 'Deine E-Mail-Adresse' },
  'contact.send': { en: 'Send Message', de: 'Nachricht senden' },
  'contact.namePlaceholder': { en: 'Your name', de: 'Dein Name' },
  'contact.emailPlaceholder': { en: 'Your email', de: 'Deine E-Mail' },
  'footer.legalNotice': { en: 'Legal Notice', de: 'Impressum' },
  'footer.privacy': { en: 'Privacy Policy', de: 'Datenschutz' },
}

function buildMergedStrings(
  languages: SiteLanguage[],
  saved: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const merged: Record<string, Record<string, string>> = {}
  for (const [key, defaults] of Object.entries(DEFAULT_STRINGS)) {
    const entry: Record<string, string> = {}
    for (const lang of languages) {
      const fallback = defaults[lang.code] ?? defaults.en ?? ''
      entry[lang.code] = saved[key]?.[lang.code] ?? fallback
    }
    merged[key] = entry
  }
  return merged
}

async function fetchConfig(): Promise<{
  saved: Record<string, Record<string, string>>
  languages: SiteLanguage[]
}> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['translations', 'languages'])

    const rows = (data ?? []) as Array<{ key: string; value: unknown }>
    const rowMap = Object.fromEntries(rows.map((row) => [row.key, row.value]))
    const languages = parseLanguagesConfig(rowMap.languages)
    return {
      saved: parseTranslationsConfig(rowMap.translations),
      languages,
    }
  } catch {
    return { saved: {}, languages: parseLanguagesConfig(null) }
  }
}

export default async function TranslationsPage() {
  const { saved, languages } = await fetchConfig()
  const merged = buildMergedStrings(languages, saved)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Translations</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage site languages and override UI strings per locale. Empty fields fall back to default values.
        </p>
      </div>
      <TranslationsEditor
        strings={merged}
        defaultStrings={DEFAULT_STRINGS}
        languages={languages}
      />
    </div>
  )
}