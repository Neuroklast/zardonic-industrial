// scripts/r2-migrate-legacy-urls.ts
//
// CLI wrapper around lib/legacy-url-migrator.ts: migrates rows whose `*_url`
// columns still point at the legacy Supabase Storage host
// (`https://<ref>.supabase.co/storage/v1/object/public/...`) onto Cloudflare R2.
// The same migration runs automatically on every Production deploy
// (lib/legacy-url-migration-on-deploy.ts) — this script exists for dry-runs,
// manual re-runs and local environments.
//
// Usage:
//   npm run migrate-legacy            # dry-run: prints the plan, writes nothing
//   npm run migrate-legacy -- --apply # actually migrates
//
// Requires .env.local with SUPABASE_SERVICE_ROLE_KEY + R2_* credentials.

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { listAllR2ObjectKeys } from '@/lib/r2-inventory'
import { MEDIA_BUCKET } from '@/lib/constants'
import { migrateLegacySupabaseUrlsToR2 } from '@/lib/legacy-url-migrator'

dotenv.config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')

function requireEnv(name: string): boolean {
  if (process.env[name]) return true
  console.error(`Missing env var ${name} in .env.local`)
  return false
}

async function main() {
  console.log(`Supabase → R2 legacy URL migration (${APPLY ? 'APPLY MODE' : 'dry-run'})`)

  const envOk = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'R2_PUBLIC_HOST',
    'R2_BUCKET_MEDIA',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
  ].every(requireEnv)
  if (!envOk) process.exit(1)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const objectKeys = await listAllR2ObjectKeys({ bucket: MEDIA_BUCKET })
  console.log(`R2 inventory: ${objectKeys.length} objects\n`)

  const result = await migrateLegacySupabaseUrlsToR2({
    supabase,
    objectKeys,
    apply: APPLY,
    log: (line) => console.log(line),
  })

  console.log('\n── Summary ──────────────────────────────────────────────')
  console.log(
    `scanned: ${result.scanned} | existing R2 object reused: ${result.reused} | ` +
      `copied to R2: ${result.copied} | URLs cleared (path set): ${result.cleaned} | ` +
      `unchanged: ${result.unchanged} | failed: ${result.failed}`,
  )
  for (const failure of result.failures) {
    console.log(`  ✗ ${failure}`)
  }
  console.log(
    `\n${APPLY ? 'Done — DB + R2 updated.' : 'Nothing written (dry-run). Re-run with --apply to migrate.'}`,
  )
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
