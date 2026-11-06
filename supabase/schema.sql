-- ============================================================
-- Zardonic Industrial – Canonical Supabase Schema (idempotent)
-- Run this entire file in the Supabase SQL Editor anytime.
-- Safe on fresh projects AND existing databases (re-runnable).
-- ============================================================

-- ─── profiles (admin auth) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- ─── releases ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'single',
  release_date date,
  description text,
  cover_storage_path text,
  cover_url text,
  streaming_links jsonb DEFAULT '[]',
  tracks jsonb DEFAULT '[]',
  custom_links jsonb DEFAULT '[]',
  artists text[] DEFAULT '{}',
  itunes_id text,
  spotify_id text,
  discogs_id text,
  active boolean DEFAULT true,
  manually_edited boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ─── gigs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  venue text,
  city text,
  country text,
  event_date timestamptz NOT NULL,
  ticket_url text,
  festival_name text,
  description text,
  bandsintown_id text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─── gallery ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text,
  image_url text,
  alt text,
  caption text,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─── bio ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  updated_at timestamptz DEFAULT now()
);

-- ─── social_links ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  label text,
  display_order integer DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  logo_storage_path text,
  logo_url text
);

ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS logo_storage_path text;
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS logo_url text;

-- ─── partners ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text,
  logo_storage_path text,
  logo_url text,
  category text DEFAULT 'partner',
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  logo_white boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ─── site_config (key-value) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ─── api_secrets (encrypted integration keys, admin-only) ───
CREATE TABLE IF NOT EXISTS public.api_secrets (
  key text PRIMARY KEY,
  encrypted_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ─── contact delivery diagnostics (never store message or sender PII) ───
CREATE TABLE IF NOT EXISTS public.contact_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('accepted', 'configuration', 'provider', 'rate_limit', 'internal')),
  code text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 80),
  detail text NOT NULL CHECK (char_length(detail) BETWEEN 1 AND 300),
  http_status integer CHECK (http_status BETWEEN 100 AND 599),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_delivery_events_created_at_idx
  ON public.contact_delivery_events (created_at DESC);
ALTER TABLE public.contact_delivery_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_delivery_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.contact_delivery_events TO service_role;

-- ─── music_highlights ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.music_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── merchandise ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.merchandise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_storage_path text,
  image_url text,
  external_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── soundpacks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.soundpacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_storage_path text,
  image_url text,
  external_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── media_downloads (press kit / downloadable assets) ───────
CREATE TABLE IF NOT EXISTS public.media_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  file_storage_path text,
  file_url text,
  file_mime text,
  file_size_bytes bigint,
  original_filename text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_downloads_category_check CHECK (
    category IN ('photo', 'logo', 'document', 'audio', 'other')
  )
);

-- ─── sync_jobs (async catalogue / maintenance workers) ───────
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  phase text,
  payload jsonb NOT NULL DEFAULT '{}',
  progress jsonb NOT NULL DEFAULT '{"processed":0,"total":null,"synced":0,"updated":0,"skipped":0,"errors":[]}',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- ─── analytics_events (consent-gated client telemetry) ───────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  target text,
  meta jsonb,
  heatmap jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_type_idx
  ON public.analytics_events (type);

-- ─── newsletter_subscribers ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  consent_given boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmation_token text UNIQUE,
  confirmation_expires_at timestamptz,
  unsubscribe_token text UNIQUE,
  unsubscribed_at timestamptz
);

-- ============================================================
-- Column bridges (upgrade legacy DBs safely)
-- ============================================================

-- gallery: title → alt, visible → active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'alt'
  ) THEN
    ALTER TABLE public.gallery RENAME COLUMN title TO alt;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'visible'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.gallery RENAME COLUMN visible TO active;
  END IF;
END;
$$;

ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS alt text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- newsletter_subscribers: double opt-in + unsubscribe tokens
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmation_token text UNIQUE;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE;

-- Legacy single-opt-in rows: treat existing active subscribers as confirmed
UPDATE public.newsletter_subscribers
SET confirmed_at = subscribed_at
WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL;

-- Legacy confirmed rows need unsubscribe tokens for self-service opt-out
UPDATE public.newsletter_subscribers
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE confirmed_at IS NOT NULL
  AND unsubscribed_at IS NULL
  AND unsubscribe_token IS NULL;

-- partners: visible → active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'visible'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.partners RENAME COLUMN visible TO active;
  END IF;
END;
$$;

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS logo_storage_path text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
-- partners: logo_hover_white → logo_white (rename misnamed column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'logo_hover_white'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'logo_white'
  ) THEN
    ALTER TABLE public.partners RENAME COLUMN logo_hover_white TO logo_white;
  END IF;
END;
$$;

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS logo_white boolean DEFAULT true;
ALTER TABLE public.partners ALTER COLUMN logo_white SET DEFAULT true;
UPDATE public.partners SET logo_white = true WHERE logo_white IS NULL;

-- social_links
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- gigs (Bandsintown dedup)
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS bandsintown_id text;

CREATE UNIQUE INDEX IF NOT EXISTS gigs_bandsintown_id_unique
  ON public.gigs (bandsintown_id)
  WHERE bandsintown_id IS NOT NULL;

-- releases columns
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS cover_storage_path text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS tracks jsonb DEFAULT '[]';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS custom_links jsonb DEFAULT '[]';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS itunes_id text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS spotify_id text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS discogs_id text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS manually_edited boolean NOT NULL DEFAULT false;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS artists text[] DEFAULT '{}';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS streaming_links jsonb DEFAULT '[]';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS last_enriched_at timestamptz;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS tracks_source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'releases_itunes_id_key'
      AND conrelid = 'public.releases'::regclass
  ) THEN
    ALTER TABLE public.releases ADD CONSTRAINT releases_itunes_id_key UNIQUE (itunes_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS releases_itunes_id_idx
  ON public.releases (itunes_id)
  WHERE itunes_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'releases_spotify_id_key'
      AND conrelid = 'public.releases'::regclass
  ) THEN
    ALTER TABLE public.releases ADD CONSTRAINT releases_spotify_id_key UNIQUE (spotify_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'releases_discogs_id_key'
      AND conrelid = 'public.releases'::regclass
  ) THEN
    ALTER TABLE public.releases ADD CONSTRAINT releases_discogs_id_key UNIQUE (discogs_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS releases_spotify_id_idx
  ON public.releases (spotify_id)
  WHERE spotify_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS releases_discogs_id_idx
  ON public.releases (discogs_id)
  WHERE discogs_id IS NOT NULL;

-- site_config: text value → jsonb, uuid id → key PK
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_config'
      AND column_name = 'value' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.site_config
      ALTER COLUMN value TYPE jsonb
      USING CASE
        WHEN value IS NULL OR trim(value) = '' THEN '{}'::jsonb
        ELSE value::jsonb
      END;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_config' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.site_config DROP COLUMN id;

    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'site_config_key_key'
        AND conrelid = 'public.site_config'::regclass
    ) THEN
      ALTER TABLE public.site_config DROP CONSTRAINT site_config_key_key;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'site_config_pkey'
        AND conrelid = 'public.site_config'::regclass
    ) THEN
      ALTER TABLE public.site_config ADD PRIMARY KEY (key);
    END IF;
  END IF;
END;
$$;

-- bio updated_at
ALTER TABLE public.bio ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- NOT NULL backfills
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='music_highlights'
      AND column_name='display_order' AND is_nullable='YES'
  ) THEN
    UPDATE public.music_highlights SET display_order = 0 WHERE display_order IS NULL;
    ALTER TABLE public.music_highlights ALTER COLUMN display_order SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='music_highlights'
      AND column_name='active' AND is_nullable='YES'
  ) THEN
    UPDATE public.music_highlights SET active = true WHERE active IS NULL;
    ALTER TABLE public.music_highlights ALTER COLUMN active SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='music_highlights'
      AND column_name='created_at' AND is_nullable='YES'
  ) THEN
    UPDATE public.music_highlights SET created_at = now() WHERE created_at IS NULL;
    ALTER TABLE public.music_highlights ALTER COLUMN created_at SET NOT NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='merchandise'
      AND column_name='display_order' AND is_nullable='YES'
  ) THEN
    UPDATE public.merchandise SET display_order = 0 WHERE display_order IS NULL;
    ALTER TABLE public.merchandise ALTER COLUMN display_order SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='merchandise'
      AND column_name='active' AND is_nullable='YES'
  ) THEN
    UPDATE public.merchandise SET active = true WHERE active IS NULL;
    ALTER TABLE public.merchandise ALTER COLUMN active SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='merchandise'
      AND column_name='created_at' AND is_nullable='YES'
  ) THEN
    UPDATE public.merchandise SET created_at = now() WHERE created_at IS NULL;
    ALTER TABLE public.merchandise ALTER COLUMN created_at SET NOT NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='soundpacks'
      AND column_name='display_order' AND is_nullable='YES'
  ) THEN
    UPDATE public.soundpacks SET display_order = 0 WHERE display_order IS NULL;
    ALTER TABLE public.soundpacks ALTER COLUMN display_order SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='soundpacks'
      AND column_name='active' AND is_nullable='YES'
  ) THEN
    UPDATE public.soundpacks SET active = true WHERE active IS NULL;
    ALTER TABLE public.soundpacks ALTER COLUMN active SET NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='soundpacks'
      AND column_name='created_at' AND is_nullable='YES'
  ) THEN
    UPDATE public.soundpacks SET created_at = now() WHERE created_at IS NULL;
    ALTER TABLE public.soundpacks ALTER COLUMN created_at SET NOT NULL;
  END IF;
END;
$$;


-- --- news_posts ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text NOT NULL DEFAULT '',
  cover_storage_path text,
  cover_url text,
  published_at timestamptz DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_posts_slug_idx ON public.news_posts (slug);
CREATE INDEX IF NOT EXISTS news_posts_published_idx ON public.news_posts (published_at DESC);
-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundpacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sync_jobs' AND policyname='Admin all sync_jobs') THEN
    EXECUTE $p$CREATE POLICY "Admin all sync_jobs" ON public.sync_jobs USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admin read') THEN
    EXECUTE 'CREATE POLICY "Admin read" ON public.profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='releases' AND policyname='Public read releases') THEN
    EXECUTE 'CREATE POLICY "Public read releases" ON public.releases FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='releases' AND policyname='Admin all releases') THEN
    EXECUTE $p$CREATE POLICY "Admin all releases" ON public.releases USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gigs' AND policyname='Public read gigs') THEN
    EXECUTE 'CREATE POLICY "Public read gigs" ON public.gigs FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gigs' AND policyname='Admin all gigs') THEN
    EXECUTE $p$CREATE POLICY "Admin all gigs" ON public.gigs USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery' AND policyname='Public read gallery') THEN
    EXECUTE 'CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery' AND policyname='Admin all gallery') THEN
    EXECUTE $p$CREATE POLICY "Admin all gallery" ON public.gallery USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bio' AND policyname='Public read bio') THEN
    EXECUTE 'CREATE POLICY "Public read bio" ON public.bio FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bio' AND policyname='Admin all bio') THEN
    EXECUTE $p$CREATE POLICY "Admin all bio" ON public.bio USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_links' AND policyname='Public read social') THEN
    EXECUTE 'CREATE POLICY "Public read social" ON public.social_links FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_links' AND policyname='Admin all social') THEN
    EXECUTE $p$CREATE POLICY "Admin all social" ON public.social_links USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Public read partners') THEN
    EXECUTE 'CREATE POLICY "Public read partners" ON public.partners FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='partners' AND policyname='Admin all partners') THEN
    EXECUTE $p$CREATE POLICY "Admin all partners" ON public.partners USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='music_highlights' AND policyname='Public read music_highlights') THEN
    EXECUTE 'CREATE POLICY "Public read music_highlights" ON public.music_highlights FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='music_highlights' AND policyname='Admin all music_highlights') THEN
    EXECUTE $p$CREATE POLICY "Admin all music_highlights" ON public.music_highlights USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='merchandise' AND policyname='Public read merchandise') THEN
    EXECUTE 'CREATE POLICY "Public read merchandise" ON public.merchandise FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='merchandise' AND policyname='Admin all merchandise') THEN
    EXECUTE $p$CREATE POLICY "Admin all merchandise" ON public.merchandise USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='soundpacks' AND policyname='Public read soundpacks') THEN
    EXECUTE 'CREATE POLICY "Public read soundpacks" ON public.soundpacks FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='soundpacks' AND policyname='Admin all soundpacks') THEN
    EXECUTE $p$CREATE POLICY "Admin all soundpacks" ON public.soundpacks USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_downloads' AND policyname='Public read media_downloads') THEN
    EXECUTE 'CREATE POLICY "Public read media_downloads" ON public.media_downloads FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='media_downloads' AND policyname='Admin all media_downloads') THEN
    EXECUTE $p$CREATE POLICY "Admin all media_downloads" ON public.media_downloads USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_config' AND policyname='Public read config') THEN
    EXECUTE 'CREATE POLICY "Public read config" ON public.site_config FOR SELECT USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_config' AND policyname='Admin all config') THEN
    EXECUTE $p$CREATE POLICY "Admin all config" ON public.site_config USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_secrets' AND policyname='Admin read api_secrets') THEN
    EXECUTE $p$CREATE POLICY "Admin read api_secrets" ON public.api_secrets FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_secrets' AND policyname='Admin insert api_secrets') THEN
    EXECUTE $p$CREATE POLICY "Admin insert api_secrets" ON public.api_secrets FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_secrets' AND policyname='Admin update api_secrets') THEN
    EXECUTE $p$CREATE POLICY "Admin update api_secrets" ON public.api_secrets FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='api_secrets' AND policyname='Admin delete api_secrets') THEN
    EXECUTE $p$CREATE POLICY "Admin delete api_secrets" ON public.api_secrets FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Admin all newsletter_subscribers') THEN
    EXECUTE $p$CREATE POLICY "Admin all newsletter_subscribers" ON public.newsletter_subscribers USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Public subscribe') THEN
    EXECUTE 'CREATE POLICY "Public subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (consent_given = true)';
  END IF;
END; $$;

-- Consent-gated public analytics INSERT (App Router /api/analytics). Read and
-- mutate remain admin-only; anon may only append an event.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='analytics_events' AND policyname='anon insert analytics') THEN
    EXECUTE 'CREATE POLICY "anon insert analytics" ON public.analytics_events FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END; $$;

-- ============================================================
-- Auth trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Default site_config seeds (idempotent)
-- ============================================================
INSERT INTO public.site_config (key, value) VALUES
  ('hero',        '{"headline":"ZARDONIC","tagline":"Industrial Metal / Drum & Bass","ctaLabel":"Listen Now","ctaUrl":"#music"}'::jsonb),
  ('newsletter',  '{"heading":"Mailing List","body":"Subscribe to get the latest news, releases and exclusive content."}'::jsonb),
  ('merchandise', '{}'::jsonb),
  ('footer',      '{"legalNoticeUrl":"/legal-notice","privacyPolicyUrl":"/privacy-policy"}'::jsonb),
  ('legal',       '{"operatorName":"","street":"","zipCity":"","country":"Germany","email":""}'::jsonb),
  ('background',  '{}'::jsonb),
  ('appearance',  '{"crtEnabled":true,"scanlineEnabled":true,"noiseEnabled":true,"accentColor":"#dc2626","accentColorSecondary":"#7c3aed","vignetteOpacity":0.3,"chromaticStrength":0.5}'::jsonb),
  ('sections',    '[{"id":"hero","label":"Hero","visible":true,"order":0},{"id":"bio","label":"Biography","visible":true,"order":1},{"id":"credits","label":"Credits & Partners","visible":true,"order":2},{"id":"gallery","label":"Gallery","visible":true,"order":3},{"id":"media","label":"Media","visible":true,"order":4},{"id":"music-highlights","label":"Music Highlights","visible":true,"order":5},{"id":"releases","label":"Discography","visible":true,"order":6},{"id":"social","label":"Connect","visible":true,"order":7},{"id":"spotify","label":"Music Stream","visible":true,"order":8},{"id":"merchandise","label":"Merchandise","visible":true,"order":9},{"id":"soundpacks","label":"Soundpacks","visible":true,"order":10},{"id":"gigs","label":"Events","visible":true,"order":11},{"id":"newsletter","label":"Newsletter","visible":true,"order":12},{"id":"contact","label":"Contact","visible":true,"order":13}]'::jsonb),
  ('social',      '{"spotify":"","instagram":"","facebook":"","youtube":"","soundcloud":"","tiktok":""}'::jsonb),
  ('analytics',   '{"enabled":false,"trackPageViews":false,"trackEvents":false}'::jsonb),
  ('translations', '{}'::jsonb),
  ('catalogue_sync', '{"artistName":"Zardonic","itunesArtistId":"","spotifyArtistId":"","discogsArtistId":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='news_posts' AND policyname='Public read news') THEN
    EXECUTE 'CREATE POLICY "Public read news" ON public.news_posts FOR SELECT USING (active = true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='news_posts' AND policyname='Admin all news') THEN
    EXECUTE $p$CREATE POLICY "Admin all news" ON public.news_posts USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
END; $$;

-- ============================================================
-- Media content hashes (idempotent) — used by R2 reconcile + 404 self-heal
-- ============================================================
-- Content-addressed object keys are `${prefix}/<sha256>.${ext}`. The reconcile
-- backfills `content_hash` from the storage path's filename so DB queries and the
-- runtime self-heal could match a stale reference to the live object without
-- relying only on filename/prefix heuristics.
ALTER TABLE public.releases          ADD COLUMN IF NOT EXISTS cover_content_hash text;
ALTER TABLE public.gallery           ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE public.social_links      ADD COLUMN IF NOT EXISTS logo_content_hash text;
ALTER TABLE public.partners          ADD COLUMN IF NOT EXISTS logo_content_hash text;
ALTER TABLE public.merchandise       ADD COLUMN IF NOT EXISTS image_content_hash text;
ALTER TABLE public.soundpacks        ADD COLUMN IF NOT EXISTS image_content_hash text;
ALTER TABLE public.media_downloads   ADD COLUMN IF NOT EXISTS file_content_hash text;
ALTER TABLE public.news_posts        ADD COLUMN IF NOT EXISTS cover_content_hash text;

-- ============================================================
-- Rate limiting (Supabase-backed distributed limiter, no Redis)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx
  ON public.rate_limits (reset_at);

-- Internal counters only: never exposed via PostgREST. RLS with a deny-all
-- policy (no SELECT/INSERT for anon/authenticated). service_role bypasses RLS;
-- consume_rate_limit() is SECURITY DEFINER (owner). Do not FORCE RLS — that
-- would block the definer function. Fixes advisor rls_disabled_in_public.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role, postgres;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rate_limits' AND policyname = 'No direct access'
  ) THEN
    EXECUTE $p$CREATE POLICY "No direct access" ON public.rate_limits
      FOR ALL TO anon, authenticated
      USING (false) WITH CHECK (false)$p$;
  END IF;
END; $$;

-- Atomic fixed-window counter. SECURITY DEFINER + service-role only; the
-- anon/authenticated roles cannot invoke it (they could otherwise hammer it).
-- Keys are already hashed IPs (SHA-256 + RATE_LIMIT_SALT) — never raw IPs.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_reset_at timestamptz;
  v_count integer;
BEGIN
  IF p_limit <= 0 OR p_window_seconds <= 0 THEN
    RETURN jsonb_build_object('count', 0, 'reset_at', 0);
  END IF;

  -- Opportunistic cleanup of expired buckets (indexed by reset_at).
  DELETE FROM public.rate_limits WHERE reset_at <= v_now;

  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.rate_limits.reset_at <= v_now THEN 1
      ELSE public.rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN public.rate_limits.reset_at <= v_now THEN v_now + make_interval(secs => p_window_seconds)
      ELSE public.rate_limits.reset_at
    END
  RETURNING count, reset_at INTO v_count, v_reset_at;

  RETURN jsonb_build_object(
    'count', v_count,
    'reset_at', (extract(epoch FROM v_reset_at) * 1000)::bigint
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer)
  TO service_role, postgres;

-- ============================================================
-- MCP OAuth + editorial approval security (canonical)
-- ============================================================
-- MCP OAuth and human-reviewed editorial requests (canonical schema)
-- Enable Supabase OAuth Server separately in the Supabase dashboard.
-- Existing content rows are not altered by this section.

-- Private registration of trusted third-party OAuth clients.
-- The token must be issued by Supabase Auth and explicitly allowed here.
CREATE TABLE IF NOT EXISTS public.mcp_oauth_clients (
  client_id text PRIMARY KEY CHECK (client_id ~ '^[A-Za-z0-9._:-]{8,180}$'),
  provider text NOT NULL CHECK (provider IN ('chatgpt','claude','opencode','gemini','cursor','other')),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 80),
  enabled boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_oauth_clients FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_oauth_clients TO service_role;

-- MFA-attested MCP grants: Supabase OAuth exchange creates a NEW AAL1 session,
-- even when the browser's approval session was verified at AAL2.
-- Keep MFA proof in a private, short-lived server-side grant; never weaken
-- the MFA check on the administrator's approval/verification actions.
CREATE TABLE IF NOT EXISTS public.mcp_oauth_mfa_grants (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES public.mcp_oauth_clients(client_id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  PRIMARY KEY (user_id, client_id),
  CONSTRAINT mcp_oauth_mfa_grant_validity CHECK (expires_at > verified_at)
);
ALTER TABLE public.mcp_oauth_mfa_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_oauth_mfa_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_oauth_mfa_grants TO service_role;

-- Validate actual Supabase OAuth session and user consent before accepting
-- the signed OAuth JWT. AAL1 is expected for a separately created OAuth session,
-- but a live MFA-attested authorization MUST exist for the same user and client.
-- SQL SECURITY DEFINER reads private auth.sessions and auth.oauth_consents,
-- while only the server service role can execute the RPC.
CREATE OR REPLACE FUNCTION public.mcp_verify_oauth_mfa_grant(
  p_session_id uuid, p_user_id uuid, p_client_id text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM auth.sessions s
      JOIN public.mcp_oauth_mfa_grants g
        ON g.user_id = s.user_id AND g.client_id = p_client_id
      JOIN auth.oauth_consents c
        ON c.user_id = s.user_id AND c.client_id = s.oauth_client_id
     WHERE s.id = p_session_id
       AND s.user_id = p_user_id
       AND s.oauth_client_id::text = p_client_id
       AND c.revoked_at IS NULL
       AND g.verified_at <= now()
       AND g.expires_at > now()
  );
$$;
REVOKE ALL ON FUNCTION public.mcp_verify_oauth_mfa_grant(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_verify_oauth_mfa_grant(uuid, uuid, text) TO service_role;

-- MCP editorial change proposals. Neither anonymous nor logged-in visitors can read
-- this table through PostgREST. Only the server-side service role touches it.
-- No AI tool may write directly to public content tables.
CREATE TABLE IF NOT EXISTS public.mcp_content_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'config')),
  target_id uuid,
  target_key text,
  changes jsonb NOT NULL,
  previous_hash text,
  previous_snapshot jsonb,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  client_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applying', 'approved', 'rejected', 'conflict', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  error text,
  CONSTRAINT mcp_target_check CHECK (
    (operation = 'create' AND target_id IS NULL AND target_key IS NULL AND previous_hash IS NULL AND previous_snapshot IS NULL)
    OR (operation IN ('update','delete') AND target_id IS NOT NULL AND target_key IS NULL AND previous_hash IS NOT NULL AND previous_snapshot IS NOT NULL)
    OR (operation = 'config' AND target_id IS NULL AND target_key IN ('hero','merchandise','translations') AND previous_hash IS NOT NULL AND previous_snapshot IS NOT NULL)
  )
);
-- Reapply the validated operation constraints on existing installations
-- while retaining the same mandatory target/snapshot requirement.
ALTER TABLE public.mcp_content_requests DROP CONSTRAINT IF EXISTS mcp_content_requests_operation_check;
ALTER TABLE public.mcp_content_requests ADD CONSTRAINT mcp_content_requests_operation_check
  CHECK (operation IN ('create','update','delete','config'));
ALTER TABLE public.mcp_content_requests DROP CONSTRAINT IF EXISTS mcp_target_check;
ALTER TABLE public.mcp_content_requests ADD CONSTRAINT mcp_target_check CHECK (
    (operation = 'create' AND target_id IS NULL AND target_key IS NULL AND previous_hash IS NULL AND previous_snapshot IS NULL)
    OR (operation IN ('update','delete') AND target_id IS NOT NULL AND target_key IS NULL AND previous_hash IS NOT NULL AND previous_snapshot IS NOT NULL)
    OR (operation = 'config' AND target_id IS NULL AND target_key IN ('hero','merchandise','translations') AND previous_hash IS NOT NULL AND previous_snapshot IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS mcp_content_requests_queue_idx
  ON public.mcp_content_requests (status, created_at DESC);
ALTER TABLE public.mcp_content_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_content_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.mcp_content_requests TO service_role;


-- OWASP A01 defense in depth: do not allow external OAuth access tokens to use
-- the existing admin role's broad PostgREST RLS policies directly. OAuth clients
-- have only our dedicated MCP endpoint, which checks the exact client ID + MFA,
-- applies a field allowlist, and queues all writes for separate human approval.
-- Normal Supabase login sessions (without client_id) remain unchanged.
-- This applies to every currently RLS-protected public table, including any
-- future table that has RLS enabled when the schema is next applied.
DO $mcp_oauth_isolation$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = r.schema_name
        AND p.tablename = r.table_name
        AND p.policyname = 'Deny direct OAuth client table access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((NULLIF(current_setting(''request.jwt.claims'', true), '''')::jsonb ->> %L) IS NULL) WITH CHECK ((NULLIF(current_setting(''request.jwt.claims'', true), '''')::jsonb ->> %L) IS NULL)',
        'Deny direct OAuth client table access',
        r.schema_name, r.table_name, 'client_id', 'client_id'
      );
    END IF;
  END LOOP;
END;
$mcp_oauth_isolation$;


-- Atomic apply prevents time-of-check/time-of-use races and double approvals.
-- Called exclusively by the server-side service_role after MFA + admin checks.
-- OWASP A01: table, columns and config keys are independently allowlisted.
CREATE OR REPLACE FUNCTION public.mcp_apply_content_request(
  p_request_id uuid, p_reviewer uuid
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $mcp_apply$
DECLARE
  proposed public.mcp_content_requests%ROWTYPE;
  field_name text;
  allowed_fields text[];
  columns_list text;
  new_row jsonb;
  old_row jsonb;
  old_value jsonb;
  new_value jsonb;
  result_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_reviewer AND role = 'admin') THEN
    RAISE EXCEPTION 'Reviewer is not a current administrator';
  END IF;

  SELECT * INTO proposed FROM public.mcp_content_requests
    WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR proposed.status <> 'pending' THEN
    RETURN 'not_pending';
  END IF;
  IF proposed.changes IS NULL OR jsonb_typeof(proposed.changes) <> 'object' THEN
    RAISE EXCEPTION 'Invalid pending proposal';
  END IF;

  IF proposed.operation = 'config' THEN
    IF proposed.collection <> 'site_config'
      OR proposed.target_key NOT IN ('hero', 'merchandise', 'translations') THEN
      RAISE EXCEPTION 'Invalid configuration target';
    END IF;
    SELECT value INTO old_value FROM public.site_config
      WHERE key = proposed.target_key FOR UPDATE;
    IF NOT FOUND THEN old_value := NULL; END IF;
    IF jsonb_build_object('value', old_value) IS DISTINCT FROM proposed.previous_snapshot THEN
      UPDATE public.mcp_content_requests
        SET status='conflict', error='Site copy changed since this proposal',
            reviewed_at=now(), reviewed_by=p_reviewer
        WHERE id=p_request_id;
      RETURN 'conflict';
    END IF;

    IF proposed.target_key = 'hero' THEN
      allowed_fields := ARRAY['headline','tagline','ctaLabel','ctaUrl'];
    ELSIF proposed.target_key = 'merchandise' THEN
      allowed_fields := ARRAY['footerText','footerUrl'];
    ELSE
      allowed_fields := NULL; -- translation keys are validated by the API
    END IF;
    IF allowed_fields IS NOT NULL AND EXISTS (
      SELECT 1 FROM jsonb_object_keys(proposed.changes) key
      WHERE key <> ALL(allowed_fields)
    ) THEN
      RAISE EXCEPTION 'Forbidden config field';
    END IF;
    IF jsonb_typeof(old_value) IS DISTINCT FROM 'object' THEN
      new_value := '{}'::jsonb;
    ELSE
      new_value := old_value;
    END IF;

    IF proposed.target_key = 'translations' THEN
      FOR field_name IN SELECT jsonb_object_keys(proposed.changes) LOOP
        IF field_name IN ('__proto__','prototype','constructor') OR
           jsonb_typeof(proposed.changes -> field_name) <> 'object' THEN
          RAISE EXCEPTION 'Invalid translation patch';
        END IF;
        new_value := jsonb_set(
          new_value, ARRAY[field_name],
          (CASE WHEN jsonb_typeof(new_value -> field_name) = 'object'
             THEN new_value -> field_name ELSE '{}'::jsonb END)
             || (proposed.changes -> field_name), true
        );
      END LOOP;
    ELSE
      new_value := new_value || proposed.changes;
    END IF;
    INSERT INTO public.site_config (key, value, updated_at)
    VALUES (proposed.target_key, new_value, now())
    ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;
  ELSE
    -- No SQL identifier may be accepted without appearing in this registry.
    CASE proposed.collection
      WHEN 'news_posts' THEN allowed_fields := ARRAY['title','slug','excerpt','body','cover_storage_path','cover_url','published_at','display_order','active'];
      WHEN 'gigs' THEN allowed_fields := ARRAY['title','event_date','venue','city','country','ticket_url','festival_name','description','active'];
      WHEN 'releases' THEN allowed_fields := ARRAY['title','type','release_date','description','cover_storage_path','cover_url','streaming_links','tracks','custom_links','artists','active','display_order'];
      WHEN 'bio' THEN allowed_fields := ARRAY['content'];
      WHEN 'gallery' THEN allowed_fields := ARRAY['alt','caption','display_order','active'];
      WHEN 'media_downloads' THEN allowed_fields := ARRAY['title','description','category','display_order','active'];
      WHEN 'partners' THEN allowed_fields := ARRAY['name','url','category','display_order','active','logo_white'];
      WHEN 'social_links' THEN allowed_fields := ARRAY['platform','url','label','display_order','active'];
      WHEN 'music_highlights' THEN allowed_fields := ARRAY['title','youtube_url','description','display_order','active'];
      WHEN 'merchandise' THEN allowed_fields := ARRAY['title','external_url','display_order','active'];
      WHEN 'soundpacks' THEN allowed_fields := ARRAY['title','external_url','display_order','active'];
      ELSE RAISE EXCEPTION 'Unsupported editorial collection';
    END CASE;
    -- Deliberately destructive operation: only enumerated editorial tables.
    -- Commerce records are excluded because they have order/license relations.
    IF proposed.operation = 'delete' THEN
      IF proposed.collection NOT IN (
        'news_posts','gigs','releases','bio','gallery','media_downloads',
        'partners','social_links','music_highlights','merchandise'
      ) THEN
        RAISE EXCEPTION 'Deletion unavailable for this collection';
      END IF;
      IF jsonb_typeof(proposed.changes -> 'reason') IS DISTINCT FROM 'string'
        OR (SELECT count(*) FROM jsonb_object_keys(proposed.changes)) <> 1
        OR char_length(btrim(proposed.changes ->> 'reason')) NOT BETWEEN 5 AND 500
      THEN
        RAISE EXCEPTION 'Invalid deletion reason';
      END IF;
      EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1 FOR UPDATE', proposed.collection)
        INTO old_row USING proposed.target_id;
      IF old_row IS NULL THEN
        UPDATE public.mcp_content_requests
          SET status='conflict', error='Content no longer exists',
              reviewed_at=now(), reviewed_by=p_reviewer
          WHERE id=p_request_id;
        RETURN 'conflict';
      END IF;
      IF jsonb_typeof(proposed.previous_snapshot) <> 'object'
        OR (proposed.previous_snapshot ->> 'id') IS DISTINCT FROM proposed.target_id::text
      THEN
        RAISE EXCEPTION 'Invalid deletion snapshot';
      END IF;
      FOR field_name IN SELECT unnest(allowed_fields) LOOP
        IF NOT (proposed.previous_snapshot ? field_name)
          OR (old_row -> field_name) IS DISTINCT FROM (proposed.previous_snapshot -> field_name)
        THEN
          UPDATE public.mcp_content_requests
            SET status='conflict', error='Content changed since deletion was proposed',
                reviewed_at=now(), reviewed_by=p_reviewer
            WHERE id=p_request_id;
          RETURN 'conflict';
        END IF;
      END LOOP;
      EXECUTE format('DELETE FROM public.%I WHERE id = $1 RETURNING id', proposed.collection)
        INTO result_id USING proposed.target_id;
      IF result_id IS NULL THEN RAISE EXCEPTION 'Content removal failed'; END IF;
      UPDATE public.mcp_content_requests
        SET status='approved', reviewed_at=now(), reviewed_by=p_reviewer, error=NULL
        WHERE id=p_request_id AND status='pending';
      IF NOT FOUND THEN RAISE EXCEPTION 'Approval status was not updated'; END IF;
      RETURN 'approved';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_object_keys(proposed.changes) key
      WHERE key <> ALL(allowed_fields)
    ) THEN
      RAISE EXCEPTION 'Forbidden editorial field';
    END IF;
    IF proposed.operation = 'create' THEN
      IF proposed.collection IN ('bio','gallery','media_downloads','soundpacks') THEN
        RAISE EXCEPTION 'Creation disabled for this collection';
      END IF;
      -- All new records remain drafts, including releases, until explicitly published
      -- in the normal ZARDONIC administrator UI.
      IF proposed.collection = 'releases' THEN
        new_row := proposed.changes || '{"active":false,"manually_edited":true}'::jsonb;
      ELSE
        new_row := proposed.changes || '{"active":false}'::jsonb;
      END IF;
    ELSIF proposed.operation = 'update' THEN
      new_row := proposed.changes;
      EXECUTE format(
        'SELECT to_jsonb(t) FROM public.%I t WHERE id = $1 FOR UPDATE',
        proposed.collection
      ) INTO old_row USING proposed.target_id;
      IF old_row IS NULL THEN
        UPDATE public.mcp_content_requests
          SET status='conflict', error='Content was deleted',
              reviewed_at=now(), reviewed_by=p_reviewer WHERE id=p_request_id;
        RETURN 'conflict';
      END IF;
      IF jsonb_typeof(proposed.previous_snapshot) <> 'object' THEN
        RAISE EXCEPTION 'Missing previous content snapshot';
      END IF;
      FOR field_name IN SELECT jsonb_object_keys(proposed.previous_snapshot) LOOP
        IF field_name <> 'id' AND field_name <> ALL(allowed_fields) THEN
          RAISE EXCEPTION 'Unexpected snapshot field';
        END IF;
        IF (old_row -> field_name) IS DISTINCT FROM
           (proposed.previous_snapshot -> field_name) THEN
          UPDATE public.mcp_content_requests
            SET status='conflict', error='Content changed since this proposal',
                reviewed_at=now(), reviewed_by=p_reviewer WHERE id=p_request_id;
          RETURN 'conflict';
        END IF;
      END LOOP;
      IF proposed.collection = 'releases' THEN
        new_row := new_row || '{"manually_edited":true}'::jsonb;
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid editorial operation';
    END IF;

    SELECT string_agg(format('%I', key), ',' ORDER BY key)
      INTO columns_list FROM jsonb_object_keys(new_row) key;
    IF columns_list IS NULL THEN RAISE EXCEPTION 'No editorial fields supplied'; END IF;
    IF proposed.operation = 'create' THEN
      EXECUTE format(
        'INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) RETURNING id',
        proposed.collection, columns_list, columns_list, proposed.collection
      ) INTO result_id USING new_row;
    ELSE
      EXECUTE format(
        'UPDATE public.%I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)) WHERE id = $2 RETURNING id',
        proposed.collection, columns_list, columns_list, proposed.collection
      ) INTO result_id USING new_row, proposed.target_id;
    END IF;
    IF result_id IS NULL THEN RAISE EXCEPTION 'Content write did not complete'; END IF;
  END IF;

  UPDATE public.mcp_content_requests
    SET status='approved', reviewed_at=now(), reviewed_by=p_reviewer, error=NULL
    WHERE id=p_request_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Approval status was not updated'; END IF;
  RETURN 'approved';
END
$mcp_apply$;
REVOKE ALL ON FUNCTION public.mcp_apply_content_request(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_apply_content_request(uuid,uuid) TO service_role;


-- ============================================================
-- Supabase advisor hardening (idempotent; no separate migration)
-- ============================================================
-- The auth signup trigger is only invoked by auth.users, never via PostgREST.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Preserve rate-limit writes through service_role only.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

-- Avoid recalculating auth.uid() for every row in policies.
CREATE OR REPLACE FUNCTION public.is_direct_browser_session()
RETURNS boolean LANGUAGE sql STABLE SET search_path = ''
AS $fn$
  SELECT (NULLIF(current_setting('request.jwt.claims',true),'')::jsonb ->> 'client_id') IS NULL;
$fn$;
REVOKE ALL ON FUNCTION public.is_direct_browser_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_direct_browser_session() TO authenticated;

DO $advisor_opt$
DECLARE p record;
DECLARE read_p record;
DECLARE guard text := $guard$(EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))$guard$;
DECLARE using_expr text;
DECLARE check_expr text;
BEGIN
  FOR p IN SELECT * FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') LIKE '%auth.uid()%'
        OR coalesce(with_check,'') LIKE '%auth.uid()%')
      -- pg_policies deparses initplan calls as SELECT auth.uid() AS uid.
      -- Do not wrap that call again on every subsequent schema run.
      AND NOT (coalesce(qual,'') ~* 'SELECT[[:space:]]+auth[.]uid[(][)]'
        OR coalesce(with_check,'') ~* 'SELECT[[:space:]]+auth[.]uid[(][)]')
  LOOP
    using_expr := replace(p.qual, 'auth.uid()', '(select auth.uid())');
    check_expr := replace(p.with_check, 'auth.uid()', '(select auth.uid())');
    IF p.cmd = 'INSERT' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (%s)',p.policyname,p.tablename,check_expr);
    ELSIF p.cmd IN ('SELECT','DELETE') THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)',p.policyname,p.tablename,using_expr);
    ELSIF check_expr IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)',p.policyname,p.tablename,using_expr,check_expr);
    ELSE
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)',p.policyname,p.tablename,using_expr);
    END IF;
  END LOOP;

  -- Replace overlapping public SELECT and admin ALL permissive policies.
  -- Preserve the same public and admin read conditions while separating writes.
  FOR p IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND policyname LIKE 'Admin all %'
  LOOP
    SELECT * INTO read_p FROM pg_policies WHERE schemaname='public'
      AND tablename=p.tablename AND cmd='SELECT'
      AND policyname LIKE 'Public read %';

    IF p.tablename='newsletter_subscribers' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (consent_given = true OR %s)',
        'Public subscribe',p.tablename,guard);
      -- Public subscribe only covers INSERT. Restore private admin SELECT.
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
        'Admin select '||p.tablename,p.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (%s)',
        'Admin select '||p.tablename,p.tablename,guard);
    ELSIF read_p.policyname IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING ((%s) OR (%s))',
        read_p.policyname,p.tablename,read_p.qual,guard);
    ELSE
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
        'Admin select '||p.tablename,p.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (%s)',
        'Admin select '||p.tablename,p.tablename,guard);
    END IF;

    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
    -- The canonical schema recreates legacy "Admin all" policies on every run.
    -- Replace existing split policies atomically before creating them again.
    IF p.tablename <> 'newsletter_subscribers' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
        'Admin insert '||p.tablename,p.tablename);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (%s)',
        'Admin insert '||p.tablename,p.tablename,guard);
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Admin update '||p.tablename,p.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (%s) WITH CHECK (%s)',
      'Admin update '||p.tablename,p.tablename,guard,guard);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      'Admin delete '||p.tablename,p.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (%s)',
      'Admin delete '||p.tablename,p.tablename,guard);
  END LOOP;

  -- Preserve RESTRICTIVE OAuth isolation; evaluate only once per statement.
  FOR p IN SELECT * FROM pg_policies WHERE schemaname='public'
    AND policyname='Deny direct OAuth client table access'
    AND permissive='RESTRICTIVE'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I USING ((SELECT public.is_direct_browser_session())) WITH CHECK ((SELECT public.is_direct_browser_session()))',
      p.policyname,p.tablename);
  END LOOP;
END
$advisor_opt$;

CREATE INDEX IF NOT EXISTS sync_jobs_created_by_idx ON public.sync_jobs(created_by);
CREATE INDEX IF NOT EXISTS mcp_content_requests_requested_by_idx ON public.mcp_content_requests(requested_by);
CREATE INDEX IF NOT EXISTS mcp_content_requests_reviewed_by_idx ON public.mcp_content_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS mcp_oauth_clients_created_by_idx ON public.mcp_oauth_clients(created_by);
CREATE INDEX IF NOT EXISTS mcp_oauth_clients_updated_by_idx ON public.mcp_oauth_clients(updated_by);
CREATE INDEX IF NOT EXISTS mcp_oauth_mfa_grants_client_id_idx ON public.mcp_oauth_mfa_grants(client_id);

-- Website-only, server-validated writes. Prevent direct Data API bypass of
-- newsletter double opt-in, analytics consent and rate limits.
DROP POLICY IF EXISTS "Public subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "anon insert analytics" ON public.analytics_events;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.analytics_events FROM anon, authenticated;
