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

## Schema

Ensure the database schema has been applied before running the migration:

```bash
# In Supabase SQL Editor, run:
supabase/schema.sql
```
