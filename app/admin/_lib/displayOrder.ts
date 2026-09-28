import { createAdminClient } from '@/lib/supabaseAdmin'
import { nextDisplayOrderFromMax, type ReorderableTable } from '@/lib/admin-display-order'

export async function fetchNextDisplayOrder(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  table: ReorderableTable,
): Promise<number> {
  const { data } = await supabaseAdmin
    .from(table)
    .select('display_order')
    .not('display_order', 'is', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const max =
    data && typeof data.display_order === 'number' ? data.display_order : null
  return nextDisplayOrderFromMax(max)
}

export async function writeDisplayOrder(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  table: ReorderableTable,
  orderedIds: string[],
): Promise<{ error?: string }> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ display_order: i })
      .eq('id', orderedIds[i])
    if (error) return { error: error.message }
  }
  return {}
}
