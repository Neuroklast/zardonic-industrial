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
  artists text[] DEFAULT '{}',
  itunes_id text,
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
  active boolean NOT NULL DEFAULT true
);

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
  created_at timestamptz DEFAULT now()
);

-- ─── site_config (key-value) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

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

-- ─── newsletter_subscribers ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  consent_given boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
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

-- social_links
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- releases columns
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS cover_storage_path text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS itunes_id text;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS manually_edited boolean NOT NULL DEFAULT false;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS artists text[] DEFAULT '{}';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS streaming_links jsonb DEFAULT '[]';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

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
ALTER TABLE public.music_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundpacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Admin all newsletter_subscribers') THEN
    EXECUTE $p$CREATE POLICY "Admin all newsletter_subscribers" ON public.newsletter_subscribers USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='newsletter_subscribers' AND policyname='Public subscribe') THEN
    EXECUTE 'CREATE POLICY "Public subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (consent_given = true)';
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
  ('merchandise', '{"footerText":"Visit the official Zardonic Merchandise Store to get these and more!"}'::jsonb),
  ('footer',      '{"impressumUrl":"/impressum","privacyUrl":"/privacy"}'::jsonb),
  ('background',  '{}'::jsonb),
  ('appearance',  '{"crtEnabled":true,"scanlineEnabled":true,"noiseEnabled":true,"accentColor":"#dc2626","accentColorSecondary":"#7c3aed","vignetteOpacity":0.3,"chromaticStrength":0.5}'::jsonb),
  ('sections',    '[{"id":"hero","label":"Hero","visible":true,"order":0},{"id":"bio","label":"Biography","visible":true,"order":1},{"id":"credits","label":"Credits & Partners","visible":true,"order":2},{"id":"gallery","label":"Gallery","visible":true,"order":3},{"id":"music-highlights","label":"Music Highlights","visible":true,"order":4},{"id":"releases","label":"Discography","visible":true,"order":5},{"id":"social","label":"Connect","visible":true,"order":6},{"id":"spotify","label":"Music Stream","visible":true,"order":7},{"id":"merchandise","label":"Merchandise","visible":true,"order":8},{"id":"soundpacks","label":"Soundpacks","visible":true,"order":9},{"id":"gigs","label":"Events","visible":true,"order":10},{"id":"newsletter","label":"Newsletter","visible":true,"order":11},{"id":"contact","label":"Contact","visible":true,"order":12}]'::jsonb),
  ('social',      '{"spotify":"","instagram":"","facebook":"","youtube":"","soundcloud":"","tiktok":""}'::jsonb),
  ('sound',       '{"enabled":false,"volume":0.3,"hoverEnabled":false}'::jsonb),
  ('analytics',   '{"enabled":false,"trackPageViews":false,"trackEvents":false}'::jsonb),
  ('translations', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;