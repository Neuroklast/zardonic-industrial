-- Add itunes_id column to releases table for deduplication during iTunes sync.
-- Uses IF NOT EXISTS guard so re-running is safe.

ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS itunes_id text;

CREATE INDEX IF NOT EXISTS releases_itunes_id_idx
  ON public.releases (itunes_id)
  WHERE itunes_id IS NOT NULL;
