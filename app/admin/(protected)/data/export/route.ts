import { NextResponse } from 'next/server'
import { requireAdmin, formatAdminActionError } from '@/app/admin/_actions/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import {
  backupDownloadFileName,
  buildSiteBackup,
  type SiteBackupClient,
} from '@/lib/site-data-backup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    await requireAdmin()
  } catch (error) {
    return NextResponse.json(
      { error: await formatAdminActionError(error, 'Admin authentication required.') },
      { status: 401 },
    )
  }

  try {
    const backup = await buildSiteBackup(createAdminClient() as unknown as SiteBackupClient)
    const body = JSON.stringify(backup, null, 2)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${backupDownloadFileName()}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: await formatAdminActionError(error, 'Unable to build site export.') },
      { status: 500 },
    )
  }
}
