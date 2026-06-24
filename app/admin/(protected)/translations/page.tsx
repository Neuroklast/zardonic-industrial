import { createClient } from '@/lib/supabaseServer'
import { parseTranslationsConfig } from '@/lib/translations-config'
import TranslationsEditor from './TranslationsEditor'

const DEFAULT_STRINGS: Record<string, { de: string; en: string }> = {
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

async function fetchTranslations(): Promise<Record<string, Record<string, string>>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_config').select('value').eq('key', 'translations').single()
    return parseTranslationsConfig(data?.value)
  } catch {
    return {}
  }
}

export default async function TranslationsPage() {
  const saved = await fetchTranslations()

  const merged: Record<string, { de: string; en: string }> = {}
  for (const [k, def] of Object.entries(DEFAULT_STRINGS)) {
    merged[k] = {
      en: saved[k]?.en ?? def.en,
      de: saved[k]?.de ?? def.de,
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Translations</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Override UI strings for DE / EN. Empty fields fall back to default values.
        </p>
      </div>
      <TranslationsEditor strings={merged} defaultStrings={DEFAULT_STRINGS} />
    </div>
  )
}