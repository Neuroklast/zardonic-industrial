import { createClient } from '@/lib/supabaseServer'
import SiteConfigEditor from './SiteConfigEditor'
import { BackgroundConfigEditor } from './BackgroundConfigEditor'

const MANAGED_KEYS = [
  {
    key: 'hero',
    label: 'Hero Section',
    description: 'Headline, tagline and call-to-action button shown above the fold.',
    example: '{"headline":"ZARDONIC","tagline":"Industrial Metal / Drum & Bass","ctaLabel":"Listen Now","ctaUrl":"#music"}',
  },
  {
    key: 'newsletter',
    label: 'Newsletter Section',
    description: 'Heading and body text for the mailing list section.',
    example: '{"heading":"Mailing List","body":"Subscribe to get the latest news and releases."}',
  },
  {
    key: 'merchandise',
    label: 'Merchandise Section',
    description: 'Footer text shown below the merch grid.',
    example: '{"footerText":"Visit the official Zardonic Merchandise Store to get these and more!"}',
  },
  {
    key: 'footer',
    label: 'Footer Links',
    description: 'Impressum and Privacy Policy page paths.',
    example: '{"impressumUrl":"/impressum","privacyUrl":"/privacy"}',
  },
]

export default async function SiteConfigPage() {
  let rows: Array<{ key: string; value: unknown }> = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_config').select('key, value')
    rows = data ?? []
  } catch {
    // ignore
  }

  const rowMap = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const bgValue = (rowMap['background'] ?? {}) as Record<string, unknown>

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Site Configuration</h1>
      <div className="space-y-8">
        {/* Background has a dedicated UI with upload support */}
        <BackgroundConfigEditor currentValue={bgValue} />

        {MANAGED_KEYS.map((item) => (
          <SiteConfigEditor
            key={item.key}
            configKey={item.key}
            label={item.label}
            description={item.description}
            example={item.example}
            currentValue={
              rowMap[item.key] !== undefined
                ? JSON.stringify(rowMap[item.key], null, 2)
                : item.example
            }
          />
        ))}
      </div>
    </div>
  )
}
