'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'

const siteConfigEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
})

const rowSchema = z.record(z.string(), z.unknown())

const exportSchema = z.object({
  releases: z.array(rowSchema).optional(),
  gigs: z.array(rowSchema).optional(),
  gallery: z.array(rowSchema).optional(),
  bio: rowSchema.nullable().optional(),
  partners: z.array(rowSchema).optional(),
  social: z.array(rowSchema).optional(),
  musicHighlights: z.array(rowSchema).optional(),
  merchandise: z.array(rowSchema).optional(),
  soundpacks: z.array(rowSchema).optional(),
  config: z.array(siteConfigEntrySchema).optional(),
})

export interface ImportSiteDataResult {
  ok: boolean
  imported?: Record<string, number>
  error?: string
}

export async function importSiteData(jsonText: string): Promise<ImportSiteDataResult> {
  const result = await runAdminAction(async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return { ok: false, error: 'Invalid JSON file' }
    }

    const validated = exportSchema.safeParse(parsed)
    if (!validated.success) {
      return { ok: false, error: validated.error.message }
    }

    const data = validated.data
    const supabase = createAdminClient()
    const counts: Record<string, number> = {}

    const upsertRows = async (
      table: string,
      rows: Array<Record<string, unknown>> | undefined,
      onConflict = 'id',
    ) => {
      if (!rows?.length) return
      const { error } = await supabase.from(table).upsert(rows, { onConflict })
      if (error) throw new Error(`${table}: ${error.message}`)
      counts[table] = rows.length
    }

    await upsertRows('releases', data.releases)
    await upsertRows('gigs', data.gigs)
    await upsertRows('gallery', data.gallery)
    await upsertRows('partners', data.partners)
    await upsertRows('social_links', data.social)
    await upsertRows('music_highlights', data.musicHighlights)
    await upsertRows('merchandise', data.merchandise)
    await upsertRows('soundpacks', data.soundpacks)

    if (data.bio && typeof data.bio === 'object') {
      const bioRow = data.bio as Record<string, unknown>
      if (typeof bioRow.content === 'string') {
        const payload = {
          content: bioRow.content,
          updated_at: new Date().toISOString(),
        }

        if (typeof bioRow.id === 'string') {
          const { error } = await supabase.from('bio').upsert(
            { id: bioRow.id, ...payload },
            { onConflict: 'id' },
          )
          if (error) throw new Error(`bio: ${error.message}`)
        } else {
          const { data: existing } = await supabase.from('bio').select('id').limit(1).maybeSingle()
          if (existing?.id) {
            const { error } = await supabase.from('bio').update(payload).eq('id', existing.id)
            if (error) throw new Error(`bio: ${error.message}`)
          } else {
            const { error } = await supabase.from('bio').insert(payload)
            if (error) throw new Error(`bio: ${error.message}`)
          }
        }
        counts.bio = 1
      }
    }

    if (data.config?.length) {
      const configRows = data.config.map((entry) => ({
        key: entry.key,
        value: entry.value,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('site_config').upsert(configRows, { onConflict: 'key' })
      if (error) throw new Error(`site_config: ${error.message}`)
      counts.site_config = configRows.length
    }

    revalidatePath('/')
    revalidatePath('/admin')

    return { ok: true as const, imported: counts }
  }, 'Unable to import site data.')

  if ('error' in result) return { ok: false, error: result.error }
  return result
}