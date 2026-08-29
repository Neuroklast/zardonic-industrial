'use server'

import { revalidatePath } from 'next/cache'
import { runAdminAction } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  applySiteBackup,
  parseSiteBackupPayload,
  SITE_BACKUP_SECTIONS,
  SITE_BACKUP_VERSION,
  type SiteBackupClient,
  type SiteBackupFile,
  type SiteBackupRow,
} from '@/lib/site-data-backup'

export interface ImportSiteDataResult {
  ok: boolean
  imported?: Record<string, number>
  error?: string
}

function asBackupClient() {
  return createAdminClient() as unknown as SiteBackupClient
}

function revalidateImportedPaths() {
  revalidatePath('/')
  revalidatePath('/admin', 'layout')
  revalidatePath('/news', 'layout')
  revalidatePath('/releases')
  revalidatePath('/gigs')
  revalidatePath('/legal-notice')
  revalidatePath('/privacy-policy')
}

async function runImport(payload: unknown, revalidate: boolean): Promise<ImportSiteDataResult> {
  const parsed = parseSiteBackupPayload(payload)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const imported = (await applySiteBackup(asBackupClient(), parsed.data)).imported
  if (revalidate) revalidateImportedPaths()
  return { ok: true as const, imported }
}

export async function importSiteData(jsonText: string): Promise<ImportSiteDataResult> {
  const result = await runAdminAction(async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return { ok: false, error: 'Invalid JSON file' }
    }
    return runImport(parsed, true)
  }, 'Unable to import site data.')

  if ('error' in result) return { ok: false, error: result.error }
  return result
}

export async function importSiteBackupSection(
  exportKey: string,
  rows: SiteBackupRow[],
): Promise<ImportSiteDataResult> {
  const result = await runAdminAction(async () => {
    const section = SITE_BACKUP_SECTIONS.find(
      (item) => item.exportKey === exportKey || item.importKeys.includes(exportKey),
    )
    if (!section) {
      return { ok: false, error: `Unknown backup section: ${exportKey}` }
    }
    if (!Array.isArray(rows)) {
      return { ok: false, error: `${exportKey} must be an array of rows` }
    }

    const payload: SiteBackupFile = {
      version: SITE_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      counts: { [section.exportKey]: rows.length },
      [section.exportKey]: rows,
    }
    return runImport(payload, false)
  }, 'Unable to import site data.')

  if ('error' in result) return { ok: false, error: result.error }
  return result
}

export async function finalizeSiteDataImport(): Promise<ImportSiteDataResult> {
  const result = await runAdminAction(async () => {
    revalidateImportedPaths()
    return { ok: true as const, imported: {} }
  }, 'Unable to finish site data import.')

  if ('error' in result) return { ok: false, error: result.error }
  return result
}
