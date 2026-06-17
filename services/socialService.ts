import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { socialLinkSchema, type SocialLink } from '@/lib/schemas/social'
import { DEMO_SOCIAL_LINKS } from '@/lib/mockData'
import { isDev, hideDemoFallback } from '@/lib/devMode'

export async function getSocialLinks(): Promise<ServiceResult<SocialLink[]>> {
  if (isDev) return ok(DEMO_SOCIAL_LINKS)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return err(error.message)

    const links: SocialLink[] = []
    for (const row of data ?? []) {
      const parsed = socialLinkSchema.safeParse({
        id: String(row.id),
        platform: String(row.platform ?? ''),
        url: String(row.url ?? ''),
        label: row.label ?? null,
        displayOrder: row.display_order ?? 0,
      })
      if (parsed.success) links.push(parsed.data)
    }

    if (links.length === 0 && !hideDemoFallback) return ok(DEMO_SOCIAL_LINKS)
    return ok(links)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load social links')
  }
}
