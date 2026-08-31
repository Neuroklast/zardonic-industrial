'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { deleteAllR2Objects } from '@/lib/r2-inventory'
import {
  FACTORY_RESET_CONFIRM,
  performFactoryReset,
  type FactoryResetResult,
} from '@/lib/factory-reset'
import { dispatchAdminActionAsAdmin, createSupabaseActionContext } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'

export interface FactoryResetActionResult extends FactoryResetResult {
  r2Deleted?: number
}

/**
 * Hard factory reset. The UI (and callers) must echo the canonical phrase in
 * `confirm`; without it the reset is rejected before anything is touched.
 * Optionally wipes all R2 media objects.
 */
export async function factoryReset(options: {
  confirm: string
  deleteR2Media: boolean
}): Promise<FactoryResetActionResult | { error: string }> {
  if (options.confirm !== FACTORY_RESET_CONFIRM) {
    return { error: 'Factory reset aborted: confirmation phrase did not match.' }
  }

  const dispatch = dispatchAdminActionAsAdmin(
    'factory_reset',
    { confirm: options.confirm, deleteR2Media: Boolean(options.deleteR2Media) },
    createSupabaseActionContext(createAdminClient()),
  )
  if (!dispatch.ok) return { error: dispatch.error }

  return runAdminAction(async (): Promise<FactoryResetActionResult> => {
    const supabase = createAdminClient()
    const result = await performFactoryReset(supabase as never, {
      confirm: options.confirm,
      deleteR2Media: Boolean(options.deleteR2Media),
    })

    let r2Deleted: number | undefined
    if (options.deleteR2Media) {
      try {
        const r2 = await deleteAllR2Objects()
        r2Deleted = r2.deleted
      } catch (err) {
        result.skips.push(`R2 media: ${err instanceof Error ? err.message : 'delete failed'}`)
      }
    }

    revalidatePath('/')
    revalidatePath('/admin/data')
    revalidatePath('/admin/releases')
    revalidatePath('/admin/gigs')
    revalidatePath('/admin/gallery')

    return { ...result, r2Deleted }
  }, 'Unable to run factory reset.')
}
