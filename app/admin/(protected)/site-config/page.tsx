import { createClient } from '@/lib/supabaseServer'
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader'
import { SiteConfigTabs } from './SiteConfigTabs'

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

  return (
    <div>
      <AdminPageHeader
        title="Site Configuration"
        description="Edit appearance, hero, background and section text. Use split preview to see changes live."
      />
      <SiteConfigTabs
        heroValue={(rowMap['hero'] ?? {}) as Record<string, unknown>}
        bgValue={(rowMap['background'] ?? {}) as Record<string, unknown>}
        appearanceValue={(rowMap['appearance'] ?? {}) as Record<string, unknown>}
        newsletterValue={(rowMap['newsletter'] ?? {}) as Record<string, unknown>}
        merchandiseValue={(rowMap['merchandise'] ?? {}) as Record<string, unknown>}
        footerValue={(rowMap['footer'] ?? {}) as Record<string, unknown>}
        advancedConfigs={[]}
      />
    </div>
  )
}