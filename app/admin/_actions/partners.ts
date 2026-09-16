'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createSupabaseActionContext } from '@/app/admin/_actions/context'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { dispatchAdminActionAsAdmin } from '@/app/admin/_actions/context'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { normalizePartnerKey, PARTNER_BULK_MAX_ROWS } from '@/lib/partner-bulk-import'
import { safeExternalUrlOptional } from '@/lib/safe-external-url'
import { z } from 'zod'

const partnerCategorySchema = z.enum(['credit', 'endorsement', 'partner', 'label', 'sponsor'])

const partnerFields = {
  name: z.string().min(1),
  url: safeExternalUrlOptional.transform((v) => (v === '' ? null : v)),
  logo_storage_path: z.string().optional().nullable().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  logo_url: safeExternalUrlOptional.transform((v) => (v === '' ? null : v)),
  category: partnerCategorySchema.optional().default('partner'),
  display_order: z.coerce.number().optional().default(0),
  logo_white: z.boolean().default(true),
}

const partnerInputSchema = z.object({
  ...partnerFields,
  active: z.coerce.boolean().optional(),
})

const partnerBulkSchema = z.array(z.object(partnerFields)).min(1).max(PARTNER_BULK_MAX_ROWS)

type PartnerBulkRow = z.infer<typeof partnerBulkSchema>[number]

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    url: formData.get('url') || null,
    logo_storage_path: formData.get('logo_storage_path') || null,
    logo_url: formData.get('logo_url') || null,
    category: formData.get('category') || 'partner',
    display_order: formData.get('display_order') || 0,
    active: formData.get('active'),
    logo_white: formData.has('logo_white'),
  }
}

function withR2LogoPreference<T extends { logo_storage_path?: string | null; logo_url?: string | null }>(
  data: T,
): T {
  return preferR2StoragePath(data, 'logo_storage_path', 'logo_url')
}

export async function createPartner(formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('create_partner', parsed.data, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('partners').insert(withR2LogoPreference(parsed.data))
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to create partner.')
}

export async function updatePartner(id: string, formData: FormData) {
  const parsed = partnerInputSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_partner', { ...parsed.data, id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin
      .from('partners')
      .update(withR2LogoPreference(parsed.data))
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner.')
}

export async function deletePartner(id: string) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('delete_partner', { id }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('partners').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to delete partner.')
}

export async function togglePartnerVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin('update_partner', { id, active }, createSupabaseActionContext(supabaseAdmin))
  if (!dispatchResult.ok) return { error: dispatchResult.error }

  return runAdminAction(async () => {
    const supabase = createAdminClient()
    const { error } = await supabase.from('partners').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { success: true }
  }, 'Unable to update partner visibility.')
}

export interface CreatePartnersBatchResult {
  ok: boolean
  inserted: number
  skipped: number
  error?: string
}

export async function createPartnersBatch(rows: unknown): Promise<CreatePartnersBatchResult> {
  const parsed = partnerBulkSchema.safeParse(rows)
  if (!parsed.success) {
    return { ok: false, inserted: 0, skipped: 0, error: parsed.error.message }
  }

  const supabaseAdmin = createAdminClient()

  const dispatchResult = dispatchAdminActionAsAdmin(
    'create_partners_batch',
    { rows: parsed.data },
    createSupabaseActionContext(supabaseAdmin),
  )
  if (!dispatchResult.ok) return { ok: false, inserted: 0, skipped: 0, error: dispatchResult.error }

  const result = await runAdminAction(async () => {
    const { data: existing, error: readError } = await supabaseAdmin
      .from('partners')
      .select('name, category')
    if (readError) return { ok: false as const, inserted: 0, skipped: 0, error: readError.message }

    const existingRows = (existing ?? []) as Array<{ name: string; category: string }>
    const seen = new Set(existingRows.map((row) => normalizePartnerKey(row.name, row.category)))
    const toInsert: PartnerBulkRow[] = []
    let skipped = 0

    for (const row of parsed.data) {
      const key = normalizePartnerKey(row.name, row.category)
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      toInsert.push(withR2LogoPreference(row))
    }

    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin.from('partners').insert(toInsert)
      if (error) return { ok: false as const, inserted: 0, skipped: 0, error: error.message }
    }

    revalidatePath('/admin/partners')
    revalidatePath('/')
    return { ok: true as const, inserted: toInsert.length, skipped }
  }, 'Unable to import partners.')

  if ('error' in result && !('ok' in result)) {
    return { ok: false, inserted: 0, skipped: 0, error: result.error }
  }
  return result
}
