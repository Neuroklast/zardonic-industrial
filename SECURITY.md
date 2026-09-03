# Security Policy

Thank you for helping make the ZARDONIC band website safe and secure.

## Reporting Security Issues

If you believe you have found a security vulnerability in this project, please report it responsibly.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report security issues by:
1. Creating a private security advisory on GitHub
2. Or by contacting the maintainers directly through the repository

Please include as much of the information listed below as you can to help us better understand and resolve the issue:

* The type of issue (e.g., XSS, CSRF, authentication bypass, data exposure)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Supported Versions

We release patches for security vulnerabilities for the latest version of the project. Please ensure you are using the most recent version.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Security Architecture

### Authentication & Access Control (App Router admin)
- **Admin Authentication**: Supabase Auth (`/admin/login`) with SSR session cookies; `profiles.role = 'admin'` required for protected routes.
- **Session Cookies**: Managed by `@supabase/ssr`; HttpOnly cookies, no client-side session token storage.
- **MFA**: Enable Supabase Auth **TOTP/MFA** for the admin account for defense-in-depth (recommended; configured in the Supabase dashboard, not in code).
- **Role checks**: Server Components (`app/admin/_actions/auth.ts` `requireAdmin`), route handlers (`lib/api-admin-auth.ts`), and `proxy.ts` verify the admin role before rendering protected pages or mutating data.
- **No automatic admin promotion**: `app/admin/login/submit/route.ts` never modifies `profiles.role`. The admin row must exist in Supabase (created via the service role key or dashboard); login only authenticates.

### Admin auth (canonical)
- **Supabase Auth only** — `app/admin/login/submit/route.ts`, HttpOnly session cookies via `@supabase/ssr`.
- Legacy `api/auth.ts`, KV session tokens, and `x-session-token` header support **removed**.

### Input Validation (Zod)
All API inputs and admin mutations are validated through strict [Zod](https://zod.dev/) schemas (`api/_schemas.ts`, `lib/schemas/*`, `lib/*-schema.ts`):
- **Analytics API** (`app/api/analytics`): type enum, bounded strings, heatmap ranges.
- **Public forms**: Contact (`lib/contact-form.ts`) and newsletter (`lib/newsletter-schema.ts`) with honeypot fields.
- **External URL fields**: restricted to `http`/`https` via `lib/safe-external-url.ts` — blocks `javascript:`, `data:`, `vbscript:` (prevents click-to-XSS). Applied at write-time (admin actions/schemas) AND render-time (`lib/sanitize-href.ts`).

### Rate Limiting (Supabase Postgres — no Redis)
Rate limiting is distributed and durable via the **existing Supabase Postgres** instance — there is **no Upstash/Redis** dependency.

- **Backend**: `public.rate_limits` table + atomic `consume_rate_limit(...)` Postgres function (`supabase/schema.sql`), invoked server-side via the service-role client (`lib/rate-limit.ts`).
- **Privacy (GDPR)**: client IPs are hashed with **SHA-256 + `RATE_LIMIT_SALT`** before storage — no plaintext IPs are persisted, and buckets auto-expire.
- **Fail-closed**: on any infra error the limiter denies (except a per-instance in-memory backstop that still enforces the limit). No silent bypass.
- **Throttled endpoints**: admin login (`login`), analytics POST, newsletter subscribe, contact submit, `/api/media-fix`, `/api/partner-logo`, `/api/bandsintown`.

### Security HTTP Headers (vercel.json / next.config.mjs)
All responses include defensive HTTP headers:
- **Content-Security-Policy**: Restricts script, style, image, frame, connect sources (see the CSP note below).
- **X-Frame-Options: SAMEORIGIN** — prevents clickjacking.
- **X-Content-Type-Options: nosniff** — prevents MIME sniffing.
- **Strict-Transport-Security**: HSTS with 2-year max-age and preload.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: disables camera, microphone, geolocation, payment.
- **Cross-Origin-Opener-Policy** / **Cross-Origin-Resource-Policy**.

### CSP note
`style-src 'self' 'unsafe-inline'` is required for Tailwind and dynamic theme variables (accepted risk, tracked as TD-004). `script-src` includes `'self' 'unsafe-inline' 'unsafe-eval'` (Next.js dev/runtime); tighten this once no runtime feature requires it. Embeds use two-click consent — no auto-loading third-party scripts/frames.

### SSRF Protection
- `lib/ssrf-guard.ts` (`assertSafeRemoteUrl`) blocks private/internal networks (`127.x`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, IPv6 loopback/mapped/link-local/unique-local, metadata endpoints), protocol allowlist (`http:`/`https:` only), and DNS pre-resolution/rebinding protection.
- Used by `app/api/partner-logo/route.ts` (allowlisted to R2 / Supabase HTTPS assets) **and** the admin media-fetch actions (`cacheRemoteImage`, `fetchRemoteImageForEdit`, `cacheRemoteVideo`).
- `lib/remote-image-url.ts` / `lib/remote-video-url.ts` share the hostname blocklist for client-side URL validation.

### Edge Bot Shield
`proxy.ts` returns 403 for known scraper/AI-training user agents (`lib/crawler-blocklist.ts`) before any route render — protects both the public site and `/admin`. `public/robots.txt` mirrors the list for compliant bots. No proprietary IP blocklist/honeytoken machinery is used.

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-side, bypasses RLS) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | Yes |
| `R2_*` / `R2_BUCKET_MEDIA` | Cloudflare R2 media origin | Yes |
| `RATE_LIMIT_SALT` | Secret salt for hashing client IPs (rate limiting) | **Required in production** |
| `SECRETS_ENCRYPTION_KEY` | AES-256-GCM key for Admin → API Keys (64 hex chars) | When encrypted secrets are used |
| `CONTACT_EMAIL` | Contact form recipient | Optional (default `contact@zardonic.com`) |

## Best Practices for Deployment

1. **Environment Variables**: Never commit sensitive API keys or tokens. `env.mjs` validates required server vars and fails fast in production.
2. **Rate Limit Salt**: Set `RATE_LIMIT_SALT` to a unique, random value in production (32-byte hex). `lib/rate-limit.ts` refuses to run in production without it.
3. **Secrets**: Store integration keys via **Admin → API Keys** (AES-256-GCM encrypted, requires `SECRETS_ENCRYPTION_KEY`). Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
4. **Admin rows**: Create admin users in Supabase Auth with `profiles.role = 'admin'`; do NOT rely on any login-time auto-promotion.
5. **HTTPS**: Always deploy behind HTTPS (HSTS enforced via vercel.json).
6. **Regular Updates**: Keep dependencies up to date (CI runs `npm audit`).
7. **Log Monitoring**: Monitor `[rate-limit]`, `[SECURITY]`, and R2/SSRF warnings in server logs.

> Note: this project does not use Vercel cron triggers (Vercel Free). There is no `crons` block in `vercel.json`. The `/api/gigs-sync` and `/api/releases-track-enrich` routes are triggered manually by an admin; the `/api/r2-reconcile` and `/api/sync-jobs/reap` routes are admin-only utilities. A `CRON_SECRET` bearer is only used internally by the async sync-job continuation fallback and is optional.

## Third-Party Services

| Service | Data | Notes |
|---------|------|-------|
| Supabase | Content, auth, legal config, analytics, rate-limit counters | Review RLS policies in `supabase/schema.sql` |
| Cloudflare R2 | Media uploads | Public CDN URLs for site assets |
| Vercel | Hosting, logs, cron, edge bot shield | Configure env vars per environment |
| Resend | Contact/newsletter email | API key server-side only |
