-- ZARDONIC: secure editorial MCP OAuth and human approval migration.
-- Apply after supabase/schema.sql; enable Supabase OAuth Server before live connections.
-- Existing content is not modified by this migration.

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
-- Upgrade existing installations: allow separately reviewed editorial removal
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


