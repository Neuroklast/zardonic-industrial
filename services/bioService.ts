import { createClient } from '@/lib/supabaseServer'
import { ok, err, type ServiceResult } from '@/lib/serviceResult'
import { bioSchema, type Bio } from '@/lib/schemas/bio'
import { DEMO_BIO } from '@/lib/mockData'
import { isDev } from '@/lib/devMode'

export async function getBio(): Promise<ServiceResult<Bio>> {
  if (isDev) return ok(DEMO_BIO)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bio')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return err(error.message)
    if (!data) return ok(DEMO_BIO)

    const parsed = bioSchema.safeParse({
      id: String(data.id),
      content: data.content ?? null,
    })
    if (!parsed.success) return err('Invalid bio data')
    return ok(parsed.data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load bio')
  }
}
