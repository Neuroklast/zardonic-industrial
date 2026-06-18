-- Add itunes_id column to releases table for deduplication during iTunes sync.
-- Uses IF NOT EXISTS guard so re-running is safe.

ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS itunes_id text;

-- Enforce uniqueness so duplicate iTunes imports are impossible at the DB level.
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
