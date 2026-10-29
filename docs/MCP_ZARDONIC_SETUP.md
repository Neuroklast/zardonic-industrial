# ZARDONIC — Secure editorial MCP integration

This implementation adds a private Streamable HTTP MCP server to the existing Next.js/Vercel application. It uses Supabase Auth OAuth 2.1 with PKCE and requires a registered, explicitly allowed OAuth client, an active admin account, and MFA attestation.

## Endpoints

- MCP: `https://zardonic-website.vercel.app/api/mcp`
- Protected resource discovery: `/.well-known/oauth-protected-resource/api/mcp` and `/.well-known/oauth-protected-resource/mcp`
- OAuth administrator consent: `/admin/oauth/consent`
- OAuth compatibility redirect: `/oauth/consent`
- AI connection registry: `/admin/integrations`
- MFA setup: `/admin/mfa`
- Editorial review: `/admin/ai-content`

Use the canonical production domain instead of the Vercel hostname once it is configured. Set `NEXT_PUBLIC_SITE_URL` accordingly.

## Deployment checklist

1. Apply the existing `supabase/schema.sql` first if the project is new.
2. Create a backup. In the correct ZARDONIC Supabase project, run `supabase/migrations/20261029_secure_editorial_mcp.sql` using the SQL editor or your deployment migration workflow.
3. Enable Supabase Authentication > OAuth Server and set the authorization path to `/admin/oauth/consent`. Configure the site's exact URL in Authentication URL Configuration.
4. Enroll a TOTP authenticator at `/admin/mfa` while logged in as a current admin. OAuth consent and review require verified AAL2.
5. Create a dedicated OAuth application for each provider in Supabase Authentication > OAuth Apps. Use the exact callback address supplied by that provider, do not guess the callback URL.
6. Add its OAuth client ID in `/admin/integrations`, choose its provider, and perform the MFA verification. Registration in this local allowlist is separate from registration in Supabase Auth.
7. Deploy the branch to Vercel. Ensure `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RATE_LIMIT_SALT` are configured in the deployment. Never expose service role keys to browser clients or commit them to Git.
8. Add a custom MCP connection in ChatGPT/Claude/compatible clients using `https://YOUR_DOMAIN/api/mcp` and authenticate through OAuth.
9. Verify `server/discover` or legacy `initialize`, then `tools/list`. Test `content_capabilities` and `content_list` before submitting a harmless proposal.
10. Inspect the proposal at `/admin/ai-content` and approve or reject it. Confirm that the web site changes **only** after a separate human approval and that newly created records stay unpublished until manually made active.

The server is deliberately **not** active for unregistered clients. No bypass for test tokens or anonymous access is provided. AAL1 OAuth sessions require a separate AAL2-backed client authorization and a live Supabase OAuth consent.

## Tools

- `content_capabilities`, `content_list`, `content_get`
- `content_propose_create`, `content_propose_update`, `content_propose_delete`
- `content_my_requests`
- `site_text_capabilities`, `site_text_get`, `site_text_propose_update`

## Collections

Allowed editorial data: `news_posts`, `gigs`, `releases`, `bio`, `gallery`, `media_downloads`, `partners`, `social_links`, `music_highlights`, `merchandise`, `soundpacks`.

The field allowlist is intentionally tailored to the current ZARDONIC database schema. Do not copy additional NEUROKLAST table definitions into ZARDONIC.

The API has no access to raw SQL, credentials, users, payments, newsletters, analytics, API secrets, legal text, or R2 file uploads. File download paths and integration credentials are not editable through MCP. All mutations are proposals. Draft creations remain inactive. Delete operations require a separate explicit confirmation from the administrator and do not delete R2 media objects.

## Security testing before enabling production clients

- Anonymous, expired, wrong-client and non-admin bearer tokens must fail.
- Verify that ordinary admin sessions are not accepted as OAuth clients.
- Verify that revoked clients, revoked OAuth consent and expired MFA attestations fail.
- Test direct Supabase Data API access with the OAuth token; restrictive RLS must deny bypasses.
- Audit privileged RPC execution grants and database functions separately.
- Try hostile URLs, script payloads, invalid fields, stale content, double approvals and simultaneous approvals.
- Verify rate limit database outages deny MCP requests.
- Confirm each writable content field exists and has the expected PostgreSQL type.
- Verify mobile review UI and consent flow, OAuth refresh, and protected-route redirects.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Do not mark this deployment production-ready before a real OAuth login and end-to-end review with the correct Supabase project. The migration is committed as source code but is **not** automatically applied by a pull request.

## ChatGPT availability

Custom connector support and write capabilities vary by ChatGPT plan and workspace. If the ChatGPT workspace only offers read-only custom MCP access, use a client supporting approved write proposals. A connected MCP client must still be authorized in the site's administrator area.

## Revocation

In `/admin/integrations`, disable or remove the client. Also revoke the OAuth app/consent in Supabase when access must be fully terminated. Existing content proposals remain subject to independent administrator review.
