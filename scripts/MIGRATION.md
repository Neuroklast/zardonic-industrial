# Migration

## Setup

Make sure `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Both values are found in your Supabase project under **Settings → API**.

## Run

```bash
npm run migrate
```

Or directly with ts-node:

```bash
npx ts-node scripts/migrate-site-data.ts
```

## Migrate legacy Supabase URLs to R2

Rows whose `*_url` column still points at `https://<ref>.supabase.co/storage/v1/object/public/...`
are served from Supabase Storage and count against the (hard-limited) egress —
the admin dashboard shows a red badge on `/admin` when such rows exist.

**The migration runs automatically once** — on the first Production deploy after
this change (from `instrumentation.ts`; state in `site_config.legacy_url_migration_deploy`
plus a `doneOnce` flag). After a successful run it is never re-armed
automatically, so it does not scan the database again on later deploys. Use the
CLI for local environments, dry-runs, or manual re-runs (harmless to re-run — it
is idempotent):

```bash
npm run migrate-legacy            # dry-run: prints the migration plan, writes nothing
npm run migrate-legacy -- --apply # downloads from Supabase, uploads to R2, updates the DB
```

What it does per row (tables: `releases`, `news_posts`, `gallery`, `media_downloads`,
`merchandise`, `soundpacks`, `partners`, `social_links`; plus `site_config.background`
image/video/mobile-video):

1. Row already has a `*_storage_path` → clears the legacy URL only.
2. Object already exists in the R2 bucket (same filename / content hash) → reuses the
   existing key (no copy).
3. Otherwise: downloads the bytes once from Supabase Storage, uploads them under a
   content-addressed key keeping the legacy folder structure (`lib/r2-object-key.ts`),
   and sets `*_storage_path` + clears the legacy URL.

Rows that cannot be downloaded (404/403) are reported and left untouched — fix or
delete them in the admin editors afterwards. Re-run the script until the badge is gone
and the dry-run reports zero legacy rows.

Requires `.env.local` with `R2_PUBLIC_HOST`, `R2_BUCKET_MEDIA`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in addition to the Supabase keys above.

## What it migrates

| Table | Description |
|-------|-------------|
| `bio` | Artist biography |
| `gigs` | Live show history and upcoming events |
| `releases` | Discography with streaming links |
| `social_links` | Platform URLs (Instagram, Spotify, etc.) |
| `partners` | Credit highlights and endorsement sponsors |
| `site_config` | Hero, newsletter, merchandise, footer, background settings |

## Idempotency

The script uses `upsert` with `ON CONFLICT` handling, so it is safe to run multiple times. Existing rows will be updated, no duplicates will be created.

## Schema (required first step)

Apply the **single canonical schema** in the Supabase SQL Editor before seeding data:

1. Open **Supabase → SQL Editor**
2. Paste the full contents of [`supabase/schema.sql`](../supabase/schema.sql)
3. Run it once (safe to re-run — fully idempotent)

There are no separate migration files. `supabase/schema.sql` is the only source of truth.
