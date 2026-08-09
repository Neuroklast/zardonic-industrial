'use server'

import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { preferR2StoragePath } from '@/lib/r2-image-preference'
import { z } from 'zod'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  body: z.string().optional().default(''),
  cover_storage_path: z.string().optional().nullable(),
  cover_url: z.string().url().optional().nullable().or(z.literal('')),
  published_at: z.string().optional().nullable(),
  display_order: z.coerce.number().optional().default(0),
  active: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true' || v === 'on' || v === '1'),
})

function parseFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    slug: formData.get('slug') || null,
    excerpt: formData.get('excerpt') || null,
    body: formData.get('body') || '',
    cover_storage_path: formData.get('cover_storage_path') || null,
    cover_url: formData.get('cover_url') || null,
    published_at: formData.get('published_at') || null,
    display_order: formData.get('display_order') || 0,
    active: formData.get('active') ?? true,
  }
}

function toRow(parsed: z.infer<typeof schema>) {
  const title = parsed.title.trim()
  const slug = (parsed.slug?.trim() || slugify(title) || `post-${Date.now()}`).toLowerCase()
  const withPaths = preferR2StoragePath(
    {
      title,
      slug,
      excerpt: parsed.excerpt?.trim() || null,
      body: parsed.body ?? '',
      cover_storage_path: parsed.cover_storage_path || null,
      cover_url: parsed.cover_url || null,
      published_at: parsed.published_at || new Date().toISOString(),
      display_order: parsed.display_order ?? 0,
      active: parsed.active ?? true,
    },
    'cover_storage_path',
    'cover_url',
  )
  return withPaths
}

export async function createNewsPost(formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  return runAdminAction(async () => {
    const row = toRow(parsed.data)
    const { error } = await supabaseAdmin.from('news_posts').insert(row)
    if (error) return { error: error.message }

    revalidatePath('/admin/news')
    revalidatePath('/')
    revalidatePath('/news')
    return { success: true }
  }, 'Unable to create news post.')
}

export async function updateNewsPost(id: string, formData: FormData) {
  const parsed = schema.safeParse(parseFormData(formData))
  if (!parsed.success) return { error: parsed.error.message }

  const supabaseAdmin = createAdminClient()

  return runAdminAction(async () => {
    const row = { ...toRow(parsed.data), updated_at: new Date().toISOString() }
    const { error } = await supabaseAdmin.from('news_posts').update(row).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/news')
    revalidatePath(`/admin/news/${id}`)
    revalidatePath('/')
    revalidatePath('/news')
    revalidatePath(`/news/${row.slug}`)
    return { success: true }
  }, 'Unable to update news post.')
}

export async function deleteNewsPost(id: string) {
  const supabaseAdmin = createAdminClient()

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin.from('news_posts').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/news')
    revalidatePath('/')
    revalidatePath('/news')
    return { success: true }
  }, 'Unable to delete news post.')
}

export async function toggleNewsPostVisibility(id: string, active: boolean) {
  const supabaseAdmin = createAdminClient()

  return runAdminAction(async () => {
    const { error } = await supabaseAdmin
      .from('news_posts')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/news')
    revalidatePath('/')
    revalidatePath('/news')
    return { success: true }
  }, 'Unable to update news visibility.')
}
