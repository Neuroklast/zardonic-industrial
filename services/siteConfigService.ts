import { createAdminClient } from '@/lib/supabaseAdmin'
import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'

export async function getSiteConfig(key: string): Promise<ServiceResult<unknown>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', key)
      .single()

    if (error) return err(error.message)
    return ok(data?.value ?? null)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load site config')
  }
}

export async function setSiteConfig(
  key: string,
  value: unknown,
): Promise<ServiceResult<void>> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('site_config')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) return err(error.message)
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to save site config')
  }
}
