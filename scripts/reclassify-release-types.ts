// scripts/reclassify-release-types.ts
//
// One-off repair for catalogue rows whose stored `type` predates the canonical
// classifier in lib/release-type.ts (Apple's iTunes API reports every
// collection as collectionType "Album", so singles/EPs were historically
// mis-typed). Re-runs `classifyReleaseType` over title + stored tracks and
// writes only confident corrections. Rows with `manually_edited = true` are
// never touched, and titles without an explicit signal are left unchanged.
//
// Usage:
//   npm run reclassify-release-types            # dry-run: prints the plan
//   npm run reclassify-release-types -- --apply # actually writes
//
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { reclassifyReleaseTypes } from '@/lib/release-type-reclassify'

dotenv.config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')

function requireEnv(name: string): boolean {
  if (process.env[name]) return true
  console.error(`Missing env var ${name} in .env.local`)
  return false
}

async function main() {
  console.log(`Release type reclassification (${APPLY ? 'APPLY MODE' : 'dry-run'})`)

  const envOk = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].every(requireEnv)
  if (!envOk) process.exit(1)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const result = await reclassifyReleaseTypes({
    supabase,
    apply: APPLY,
    log: (line) => console.log(line),
  })

  console.log('\n── Summary ──────────────────────────────────────────────')
  console.log(
    `scanned: ${result.scanned} | changes: ${result.changed} | applied: ${result.applied} | ` +
      `manual (skipped): ${result.skippedManual} | unchanged: ${result.unchanged} | ` +
      `failed: ${result.errors.length}`,
  )
  for (const error of result.errors) {
    console.log(`  ✗ ${error}`)
  }
  if (!APPLY && result.changed > 0) {
    console.log('\nDry-run only. Re-run with --apply to write changes.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
