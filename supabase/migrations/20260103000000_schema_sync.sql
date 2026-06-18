-- ============================================================
-- Zardonic Industrial – Schema Sync Migration
-- Bridges the gap between the initial migration (20260101) and schema.sql.
-- Safe to run on a fresh DB (all operations are idempotent / IF NOT EXISTS).
-- ============================================================

-- ─── profiles (admin auth) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- ─── newsletter_subscribers ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  consent_given boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

-- ─── gallery: rename title → alt, visible → active, add caption ──
DO $$
BEGIN
  -- Rename title → alt (only when title exists and alt does not)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'alt'
  ) THEN
    ALTER TABLE public.gallery RENAME COLUMN title TO alt;
  END IF;

  -- Rename visible → active (only when visible exists and active does not)
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

-- Ensure alt and active exist even on fresh DBs built from schema.sql
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS alt text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- ─── partners: rename visible → active ───────────────────────
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

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- ─── social_links: add active column ─────────────────────────
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- ─── site_config: add updated_at, cast value to jsonb, key → PK ──
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Cast value from text to jsonb (only if still text type)
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

-- Replace uuid PK with key PK (only when id column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_config' AND column_name = 'id'
  ) THEN
    -- Drop the old id primary key (this also drops the PK constraint)
    ALTER TABLE public.site_config DROP COLUMN id;

    -- Drop the unique constraint on key if it was left behind
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'site_config_key_key'
        AND conrelid = 'public.site_config'::regclass
    ) THEN
      ALTER TABLE public.site_config DROP CONSTRAINT site_config_key_key;
    END IF;

    -- Add primary key on key (only if not already set)
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

-- ─── NOT NULL constraints ─────────────────────────────────────
-- music_highlights: add NOT NULL where schema.sql requires it
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

-- merchandise
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

-- soundpacks
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

-- ─── Enable RLS on all public tables ─────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundpacks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_highlights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies (idempotent — wrapped in DO blocks) ────────

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admin read') THEN
    EXECUTE 'CREATE POLICY "Admin read" ON public.profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
END; $$;

-- releases
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

-- gigs
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

-- gallery
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

-- bio
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

-- social_links
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

-- partners
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

-- soundpacks
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

-- merchandise
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

-- music_highlights
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

-- site_config
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

-- newsletter_subscribers
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

-- ─── Trigger: auto-create profile on new user signup ─────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Seed default site_config entries (idempotent) ───────────
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
