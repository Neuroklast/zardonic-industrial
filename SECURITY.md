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
- **Admin Authentication**: Supabase Auth (`/admin/login`) with SSR session cookies; `profiles.role = 'admin'` required for protected routes
- **Session Cookies**: Managed by `@supabase/ssr`; HttpOnly cookies, no client-side session token storage
- **Role checks**: Server Components and middleware verify admin role before rendering protected pages

### Admin auth (current)
- **Supabase Auth only** — `app/admin/login/submit/route.ts`, HttpOnly session cookies via `@supabase/ssr`
- Legacy `api/auth.ts`, KV session tokens, and `x-session-token` header support **removed** (2026-06-24)

### Input Validation (Zod)
All API inputs are validated through strict [Zod](https://zod.dev/) schemas (`api/_schemas.ts`):
- **KV API**: Key format, length (max 200), no control characters; value presence check
- **Auth API**: Password length/format, TOTP 6-digit format, setup token validation
- **Blocklist API**: Hashed IP format (8–64 chars), reason string, TTL range
- **iTunes API**: Search term bounded, entity enum validation
- **Security Settings**: All settings type-checked and range-bounded

### Rate Limiting
All API endpoints are protected by rate limiting (`api/_ratelimit.ts`):
- **Algorithm**: Sliding window — 30 requests per 60 seconds per client
- **Backend**: Upstash Redis (`@upstash/redis`)
- **GDPR Compliance**: Client IPs are hashed with SHA-256 + a secret salt before use as rate-limit keys. No plaintext IPs are stored. Rate-limit state auto-expires after the window period.
- **Response**: HTTP 429 `Too Many Requests` when the limit is exceeded
- **Graceful Degradation**: If Redis is unavailable, requests are allowed through

### SSRF Protection (Image Proxy)
Implemented in `lib/ssrf-guard.ts` (used by `api/image-proxy.ts` and `api/image-proxy-protected.ts`):
- Blocklist for private/internal networks: `127.x`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, IPv6 loopback/mapped/link-local/unique-local, metadata endpoints
- Hex, octal, and decimal integer IP notation blocked
- Protocol allowlist: only `http:` and `https:`
- DNS rebinding protection: hostname resolved and pinned before fetch; redirect targets re-validated
- Content-type restricted to raster `image/*` (SVG blocked to prevent XSS)

### CSP note
`style-src 'unsafe-inline'` is required for Tailwind and dynamic theme variables. Accepted for launch (TD-004); `script-src` remains restricted and embeds use two-click consent.

### Security HTTP Headers (vercel.json)
All responses include defensive HTTP headers:
- **Content-Security-Policy**: Restricts script, style, image, and frame sources
- **X-Frame-Options: DENY**: Prevents clickjacking
- **X-Content-Type-Options: nosniff**: Prevents MIME sniffing
- **Strict-Transport-Security**: HSTS with 2-year max-age and preload
- **Referrer-Policy**: Limits referrer information leakage
- **Permissions-Policy**: Disables camera, microphone, geolocation, payment

### Robots.txt Trap (Security Rewrites)
Paths that are listed as `Disallow` in robots.txt are rewarded with:
- **Tarpit Delay**: 3–8 second random delay to limit scanner throughput
- **Honeytoken Link Injection**: The 403 page contains links to further restricted paths to catch automated crawlers
- **Threat Score Increment**: Access violations increment the requester's threat score
- **Attacker Flagging**: The requesting IP is flagged for entropy injection on subsequent requests

Trapped paths include: `/admin/*`, `/dashboard/*`, `/backup/*`, `/config/*`, `/debug/*`, `/staging/*`, `/internal/*`, `/private/*`, `/data/*`, `/logs/*`, `/wp-admin/*`, `/phpmyadmin/*`, `/xmlrpc.php`, `/.env`, `/.git/*`, and others.

### Honeytokens (Intrusion Detection)
Decoy records are planted in the Redis database (`api/_honeytokens.ts`):
- Keys: `admin_backup`, `admin-backup-hash`, `db-credentials`, `api-master-key`, `backup-admin-password`
- Any read or write to these keys triggers a **silent alarm**: logged to `stderr` and persisted to `zd-honeytoken-alerts` in Redis
- The API returns a confrontational `403 Forbidden` taunt message to detected attackers

### Threat Score System (Behavioral IDS)
Requests are scored based on suspicious behavior patterns (`api/_threat-score.ts`):
- **Algorithm**: Cumulative score per (hashed) IP, 1-hour TTL
- **Score Sources**: robots.txt violations (+3), honeytoken access (+5), suspicious UA (+4), missing browser headers (+2), rate limit exceeded (+2)
- **Escalation**: WARN (≥3) → TARPIT (≥7) → AUTO-BLOCK (≥12, configurable)
- **Storage**: Ephemeral scores in Redis with 1-hour TTL
- **Auto-blocking**: IPs exceeding threshold are automatically added to the hard blocklist

### Hard Blocklist
Persistent IP blocklist for confirmed attackers (`api/_blocklist.ts`, `api/blocklist.ts`):
- Auto-populated when threat score exceeds threshold (default: 12 points)
- Admin-manageable via dashboard (add/remove entries with reason and TTL)
- Configurable TTL (default 7 days)
- All API endpoints check blocklist before processing
- Index maintained in Redis for efficient lookups

### Attacker Profiling System
Detailed per-attacker analytics aggregating behavioral data per IP hash:
- **Threat Score History**: Timeline of score changes with reasons
- **Attack Type Analysis**: Frequency distribution of attack patterns
- **User-Agent Analysis**: Classification into categories with diversity metrics
- **Behavioral Pattern Detection**: Automated identification of attack signatures
- **Incident Timeline**: Chronological log of last 50 incidents per attacker
- **Data Retention**: Profiles expire after 30 days
- **Privacy**: All data uses SHA-256 hashed IPs only (GDPR compliant)

### Zip Bomb (Optional, Disabled by Default)
When enabled, serves a gzip-compressed 10 MB null-byte payload to confirmed bots (`api/_zipbomb.ts`):
- Only triggered for IPs already flagged as attackers
- Disabled by default — enable explicitly in Security Settings

### Real-time Alerting (Optional)
Critical security events trigger immediate Discord webhook notifications (`api/_alerting.ts`):
- **Deduplication**: Max 1 alert per IP per 5 minutes
- **Configuration**: Set `DISCORD_WEBHOOK_URL` environment variable to enable

## KV Key Namespacing (Zardonic)

Most Redis keys use the `zd-` prefix to namespace Zardonic data. Session
tokens are an exception — they use the bare `session:*` prefix (as
implemented in `api/auth.ts`).

| Key | Purpose |
|---|---|
| `session:*` | Admin session tokens (4h TTL) |
| `zd-threat:*` | Threat scores per hashed IP (1h TTL) |
| `zd-blocked:*` | Hard-blocked IPs (7d default TTL) |
| `zd-blocked-index` | Set index of all blocked hashes |
| `zd-security-settings` | Persisted security configuration |
| `zd-attacker-profiles` | Per-attacker behavioral profiles |
| `zd-honeytoken-alerts` | Security incident log (last 500) |
| `zd-flagged:*` | IPs flagged for entropy injection (24h TTL) |
| `zd-admin-totp-secret` | TOTP 2FA secret (permanent) |

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | Yes |
| `RATE_LIMIT_SALT` | Secret salt for IP hashing (rate limiting) | **Required in production** |
| `ADMIN_SETUP_TOKEN` | One-time token for initial admin setup | Recommended |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for security alerts | Optional |
| `BANDSINTOWN_API_KEY` | Bandsintown API key | Optional |
| `SITE_URL` | Site URL included in alert messages | Optional |

## Best Practices for Deployment

1. **Environment Variables**: Never commit sensitive API keys or tokens
2. **Rate Limit Salt**: Set `RATE_LIMIT_SALT` to a unique, random value in production
3. **Supabase admin**: Create admin users in Supabase Auth with `profiles.role = 'admin'`; do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client
4. **Legacy KV admin** (if still used): Set `ADMIN_SETUP_TOKEN` and enable TOTP via legacy `api/` endpoints
5. **HTTPS**: Always deploy behind HTTPS (HSTS header enforced via vercel.json)
6. **Regular Updates**: Keep dependencies up to date
7. **Log Monitoring**: Monitor `[HONEYTOKEN ALERT]` and `[ACCESS VIOLATION]` entries in server logs
8. **CORS**: Set `ALLOWED_ORIGIN` to your production domain. If left unset, the contact, newsletter, and image-proxy endpoints will refuse cross-origin requests in production (`Access-Control-Allow-Origin: null`).
9. **Cron Security**: Set `CRON_SECRET` to a long random string. Cron endpoints (`/api/gigs-sync`, `/api/releases-enrich`) require `Authorization: Bearer <CRON_SECRET>` from the cron scheduler. Update your `vercel.json` cron configuration accordingly if using a custom scheduler.

## Third-Party Services

| Service | Data | Notes |
|---------|------|-------|
| Supabase | Content, auth, legal config | Primary store; review RLS policies |
| Cloudflare R2 | Media uploads | Public CDN URLs for site assets |
| Vercel | Hosting, logs | Configure env vars per environment |
| Resend | Contact/newsletter email | API key server-side only |
| Upstash Redis | Security/sync (`api/`) | Hashed IPs only for rate limiting |

Sanity CMS was evaluated but **not adopted** — no `@sanity/*` dependency in this project.
