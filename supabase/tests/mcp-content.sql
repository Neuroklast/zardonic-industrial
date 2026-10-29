-- Disposable PostgreSQL contract for MCP approval transactions.
-- Run AFTER supabase/schema.sql AND supabase/migrations/20261029_secure_editorial_mcp.sql with auth fixtures in a disposable database.
DO $mcp_test$
DECLARE
  reviewer uuid := '00000000-0000-4000-8000-000000000001';
  original uuid;
  removed_id uuid;
  stale_id uuid;
  proposal uuid;
  result text;
  existing_content jsonb;
BEGIN
  INSERT INTO auth.users(id) VALUES (reviewer) ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles(id, role) VALUES (reviewer, 'admin')
    ON CONFLICT(id) DO UPDATE SET role='admin';

  INSERT INTO public.news_posts(title, slug, body, active)
    VALUES ('Original', 'mcp-test-original', 'Before', true)
    RETURNING id INTO original;

  -- Update: atomic live content + audit.
  existing_content := jsonb_build_object('id', original, 'title', 'Original');
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_id, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES (
    'news_posts', 'update', original, '{"title":"Approved"}',
    'test-hash', existing_content, reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  result := public.mcp_apply_content_request(proposal, reviewer);
  IF result <> 'approved' OR
     (SELECT title FROM public.news_posts WHERE id=original) <> 'Approved' OR
     (SELECT status FROM public.mcp_content_requests WHERE id=proposal) <> 'approved'
  THEN RAISE EXCEPTION 'MCP update was not applied atomically'; END IF;
  IF public.mcp_apply_content_request(proposal, reviewer) <> 'not_pending' THEN
    RAISE EXCEPTION 'MCP approval replay succeeded';
  END IF;

  -- Deletion requires a separate review, preserves an audit trail and cannot
  -- execute twice. Deliberately use disposable PostgreSQL fixtures only.
  INSERT INTO public.news_posts(title, slug, body, active)
    VALUES ('For review', 'mcp-test-deletable', 'Review before removal', true)
    RETURNING id INTO removed_id;
  SELECT to_jsonb(n) INTO existing_content FROM public.news_posts n WHERE id=removed_id;
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_id, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES (
    'news_posts','delete',removed_id,'{"reason":"Duplicate editorial item"}',
    'snapshot-hash',existing_content,reviewer,'test-client'
  ) RETURNING id INTO proposal;
  IF NOT EXISTS (SELECT 1 FROM public.news_posts WHERE id=removed_id) THEN
    RAISE EXCEPTION 'Deletion proposal removed content before approval';
  END IF;
  result := public.mcp_apply_content_request(proposal,reviewer);
  IF result <> 'approved'
    OR EXISTS (SELECT 1 FROM public.news_posts WHERE id=removed_id)
    OR (SELECT status FROM public.mcp_content_requests WHERE id=proposal) <> 'approved'
  THEN RAISE EXCEPTION 'Editorial deletion approval did not remove row and audit atomically'; END IF;
  IF public.mcp_apply_content_request(proposal,reviewer) <> 'not_pending' THEN
    RAISE EXCEPTION 'Deletion approval replay was accepted';
  END IF;

  -- A concurrent edit must cause a conflict, never delete the edited row.
  INSERT INTO public.news_posts(title, slug, body, active)
    VALUES ('Old title', 'mcp-test-stale-removal', 'Keep updated content', true)
    RETURNING id INTO stale_id;
  SELECT to_jsonb(n) INTO existing_content FROM public.news_posts n WHERE id=stale_id;
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_id, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES ('news_posts','delete',stale_id,
    '{"reason":"Remove duplicate article"}','snapshot-hash',
    existing_content,reviewer,'test-client') RETURNING id INTO proposal;
  UPDATE public.news_posts SET title='New title' WHERE id=stale_id;
  IF public.mcp_apply_content_request(proposal,reviewer) <> 'conflict'
    OR NOT EXISTS (SELECT 1 FROM public.news_posts WHERE id=stale_id)
  THEN RAISE EXCEPTION 'Stale deletion removed recently edited content'; END IF;

  -- Even a crafted service-role proposal may not delete commerce records.
  INSERT INTO public.mcp_content_requests (
    collection,operation,target_id,changes,previous_hash,
    previous_snapshot,requested_by,client_id
  ) VALUES (
    'api_secrets','delete','00000000-0000-4000-8000-000000000099',
    '{"reason":"Attempted commerce deletion"}','snapshot-hash',
    '{"id":"00000000-0000-4000-8000-000000000099"}',reviewer,'test-client'
  ) RETURNING id INTO proposal;
  BEGIN
    PERFORM public.mcp_apply_content_request(proposal,reviewer);
    RAISE EXCEPTION 'Commerce deletion unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Unsupported editorial collection' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.mcp_content_requests WHERE id=proposal) <> 'pending' THEN
    RAISE EXCEPTION 'Failed commerce deletion did not roll back';
  END IF;

  -- Create: attempted active=true must still be an unpublished draft.
  INSERT INTO public.mcp_content_requests (
    collection, operation, changes, requested_by, client_id
  ) VALUES (
    'news_posts', 'create',
    '{"title":"New draft","slug":"mcp-test-draft","body":"Draft","active":true}',
    reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  result := public.mcp_apply_content_request(proposal, reviewer);
  IF result <> 'approved' OR
     (SELECT active FROM public.news_posts WHERE slug='mcp-test-draft') IS DISTINCT FROM false
  THEN RAISE EXCEPTION 'MCP created a published article'; END IF;

  -- New artist releases stay unpublished after proposal approval.
  -- Publication is an additional explicit administrator action.
  INSERT INTO public.mcp_content_requests (
    collection, operation, changes, requested_by, client_id
  ) VALUES (
    'releases', 'create',
    '{"title":"mcp-test-draft-remix","type":"remix","active":false,"artists":["ZARDONIC"]}',
    reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  IF EXISTS (SELECT 1 FROM public.releases WHERE title='mcp-test-draft-remix') THEN
    RAISE EXCEPTION 'MCP release proposal bypassed human approval';
  END IF;
  result := public.mcp_apply_content_request(proposal, reviewer);
  IF result <> 'approved'
    OR (SELECT active FROM public.releases WHERE title='mcp-test-draft-remix') IS DISTINCT FROM false
    OR (SELECT manually_edited FROM public.releases WHERE title='mcp-test-draft-remix') IS DISTINCT FROM true
  THEN RAISE EXCEPTION 'MCP approved release was not kept as a protected draft'; END IF;

  -- Stale changes must be marked conflicted; original must stay untouched.
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_id, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES (
    'news_posts', 'update', original, '{"title":"Should not land"}',
    'old-hash', '{"title":"Original"}', reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  result := public.mcp_apply_content_request(proposal, reviewer);
  IF result <> 'conflict' OR
     (SELECT title FROM public.news_posts WHERE id=original) <> 'Approved'
  THEN RAISE EXCEPTION 'MCP stale overwrite succeeded'; END IF;

  -- Site text edits must merge into prior config and be audited.
  INSERT INTO public.site_config(key,value)
    VALUES ('hero','{"headline":"Original","tagline":"Remain"}')
    ON CONFLICT (key) DO UPDATE SET value=excluded.value;
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_key, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES (
    'site_config', 'config', 'hero',
    '{"headline":"Approved"}', 'test-hash',
    '{"value":{"headline":"Original","tagline":"Remain"}}',
    reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  result := public.mcp_apply_content_request(proposal, reviewer);
  IF result <> 'approved' OR
     (SELECT value->>'headline' FROM public.site_config WHERE key='hero') <> 'Approved' OR
     (SELECT value->>'tagline' FROM public.site_config WHERE key='hero') <> 'Remain'
  THEN RAISE EXCEPTION 'MCP site text patch lost content'; END IF;

  -- Server-side allowlists must independently reject sensitive writes.
  INSERT INTO public.mcp_content_requests (
    collection, operation, target_id, changes, previous_hash,
    previous_snapshot, requested_by, client_id
  ) VALUES (
    'news_posts', 'update', original, '{"password":"do not apply"}',
    'test-hash', '{"title":"Approved"}', reviewer, 'test-client'
  ) RETURNING id INTO proposal;
  BEGIN
    PERFORM public.mcp_apply_content_request(proposal, reviewer);
    RAISE EXCEPTION 'MCP sensitive field accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Forbidden editorial field' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.mcp_content_requests WHERE id=proposal) <> 'pending' THEN
    RAISE EXCEPTION 'Failed MCP transaction did not roll back';
  END IF;

  -- AI OAuth registry must never be reachable by browser roles.
  INSERT INTO public.mcp_oauth_clients (client_id, provider, display_name, enabled, created_by, updated_by)
    VALUES ('mcp-test-client', 'claude', 'Test provider', true, reviewer, reviewer);
  IF NOT EXISTS (SELECT 1 FROM public.mcp_oauth_clients WHERE client_id='mcp-test-client' AND enabled)
  THEN RAISE EXCEPTION 'MCP OAuth registry insert failed'; END IF;
  -- OAuth MFA grants are service-role only and bind to a real Supabase OAuth
  -- session and consent; a fabricated UUID must never verify.
  INSERT INTO public.mcp_oauth_mfa_grants(user_id,client_id)
    VALUES (reviewer,'mcp-test-client');
  IF public.mcp_verify_oauth_mfa_grant('00000000-0000-4000-8000-000000000009',reviewer,'mcp-test-client')
  THEN RAISE EXCEPTION 'Fabricated OAuth session bypassed verified MFA'; END IF;
  IF NOT has_table_privilege('service_role','public.mcp_oauth_mfa_grants','INSERT')
    OR has_table_privilege('anon','public.mcp_oauth_mfa_grants','SELECT')
    OR has_table_privilege('authenticated','public.mcp_oauth_mfa_grants','INSERT')
    OR has_function_privilege('anon','public.mcp_verify_oauth_mfa_grant(uuid,uuid,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.mcp_verify_oauth_mfa_grant(uuid,uuid,text)','EXECUTE')
  THEN RAISE EXCEPTION 'MCP OAuth MFA grant access control broken'; END IF;
  UPDATE public.mcp_oauth_mfa_grants
    SET verified_at=now()-interval '31 days', expires_at=now()-interval '1 day'
    WHERE user_id=reviewer AND client_id='mcp-test-client';
  IF public.mcp_verify_oauth_mfa_grant('00000000-0000-4000-8000-000000000009',reviewer,'mcp-test-client')
  THEN RAISE EXCEPTION 'Expired OAuth MFA grant accepted'; END IF;
  UPDATE public.mcp_oauth_clients SET enabled=false WHERE client_id='mcp-test-client';
  IF EXISTS (SELECT 1 FROM public.mcp_oauth_clients WHERE client_id='mcp-test-client' AND enabled)
  THEN RAISE EXCEPTION 'MCP OAuth client revocation failed'; END IF;
  DELETE FROM public.mcp_oauth_clients WHERE client_id='mcp-test-client';
  IF EXISTS (SELECT 1 FROM public.mcp_oauth_clients WHERE client_id='mcp-test-client')
  THEN RAISE EXCEPTION 'MCP OAuth client permanent removal failed'; END IF;
  IF NOT has_table_privilege('service_role', 'public.mcp_oauth_clients', 'DELETE')
  THEN RAISE EXCEPTION 'Service role cannot remove MCP OAuth client'; END IF;
  IF has_table_privilege('anon', 'public.mcp_oauth_clients', 'SELECT')
     OR has_table_privilege('authenticated', 'public.mcp_oauth_clients', 'SELECT')
     OR has_table_privilege('authenticated', 'public.mcp_oauth_clients', 'INSERT')
     OR has_table_privilege('authenticated', 'public.mcp_oauth_clients', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.mcp_oauth_clients', 'DELETE')
     OR has_table_privilege('anon', 'public.mcp_oauth_clients', 'DELETE')
  THEN RAISE EXCEPTION 'Public OAuth client management privileges detected'; END IF;

  -- Live OAuth session is AAL1 but valid MFA-attested user/client authorization
  -- must be accepted. Revoked consent and expired proof must be rejected.
  INSERT INTO auth.oauth_clients(id)
    VALUES ('00000000-0000-4000-8000-000000000077');
  INSERT INTO public.mcp_oauth_clients
    (client_id, provider, display_name, enabled, created_by, updated_by)
    VALUES ('00000000-0000-4000-8000-000000000077','other','OAuth fixture',true,reviewer,reviewer);
  INSERT INTO auth.oauth_consents(id,user_id,client_id,revoked_at)
    VALUES ('00000000-0000-4000-8000-000000000078',reviewer,
            '00000000-0000-4000-8000-000000000077',NULL);
  INSERT INTO auth.sessions(id,user_id,oauth_client_id,aal)
    VALUES ('00000000-0000-4000-8000-000000000079',reviewer,
            '00000000-0000-4000-8000-000000000077','aal1');
  INSERT INTO public.mcp_oauth_mfa_grants(user_id,client_id)
    VALUES (reviewer,'00000000-0000-4000-8000-000000000077');
  IF NOT public.mcp_verify_oauth_mfa_grant(
    '00000000-0000-4000-8000-000000000079',reviewer,
    '00000000-0000-4000-8000-000000000077')
  THEN RAISE EXCEPTION 'Real AAL1 OAuth session with MFA proof unexpectedly denied'; END IF;
  UPDATE auth.oauth_consents SET revoked_at=now()
    WHERE id='00000000-0000-4000-8000-000000000078';
  IF public.mcp_verify_oauth_mfa_grant(
    '00000000-0000-4000-8000-000000000079',reviewer,
    '00000000-0000-4000-8000-000000000077')
  THEN RAISE EXCEPTION 'Revoked OAuth consent was accepted'; END IF;
  UPDATE auth.oauth_consents SET revoked_at=NULL
    WHERE id='00000000-0000-4000-8000-000000000078';
  UPDATE public.mcp_oauth_mfa_grants
     SET verified_at=now()-interval '31 days', expires_at=now()-interval '1 day'
   WHERE client_id='00000000-0000-4000-8000-000000000077';
  IF public.mcp_verify_oauth_mfa_grant(
    '00000000-0000-4000-8000-000000000079',reviewer,
    '00000000-0000-4000-8000-000000000077')
  THEN RAISE EXCEPTION 'Expired OAuth MFA proof was accepted'; END IF;

  -- No role other than service_role (or the table owner) can call the RPC.
  IF has_function_privilege('authenticated','public.mcp_apply_content_request(uuid,uuid)','EXECUTE')
     OR has_function_privilege('anon','public.mcp_apply_content_request(uuid,uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'MCP approval RPC publicly callable'; END IF;
END;
$mcp_test$;
