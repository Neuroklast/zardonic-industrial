# Security & GDPR

## Embeds (TDDDG / GDPR)

Spotify, YouTube, SoundCloud: **never** auto-load. Two-click consent before `<iframe>`.

## Public forms

- Contact + newsletter: honeypot (`_hp`), Zod validation, Resend delivery
- Rate limits via `lib/rate-limit.ts` (Supabase Postgres, hashed IP + `RATE_LIMIT_SALT`, fail-closed)

## Rate limiting (no Redis)

Distributed, durable rate limiting runs on the **existing Supabase Postgres** (`lib/rate-limit.ts` → `public.rate_limits` + `consume_rate_limit()` in `supabase/schema.sql`).
- Keys are SHA-256(`RATE_LIMIT_SALT` + IP) — never raw IPs (GDPR).
- **Fail-closed** on infra errors; a per-instance in-memory backstop keeps the limit enforced (no silent bypass).
- Set `RATE_LIMIT_SALT` in production — `lib/rate-limit.ts` throws if missing.
- Throttled: admin login, analytics POST, newsletter, contact, `/api/media-fix`, `/api/partner-logo`, `/api/bandsintown`.

## Storage & consent

- Analytics / tracking localStorage: gated by `CookieConsent` + `lib/consent.ts`
- Functional prefs (theme, locale, sound): permitted without analytics consent
- Import consent helpers from `@/lib/consent`, not from `CookieConsent` in non-UI modules

## Data minimization

Never log plaintext IPs — use hashed IPs (`lib/rate-limit.ts`) where server-side identification is needed. Contact form must not log email/name in production.

## Legal content (Supabase only)

| Field path | Purpose |
|------------|---------|
| `site_config.legal.operatorName` | Legal name |
| `site_config.legal.street` | Street + number (service of process) |
| `site_config.legal.zipCity` | Postal code + city |
| `site_config.legal.email` | Contact |
| `site_config.legal.privacyPolicyCustom` | Full policy override (optional) |

Templates: `lib/legal-templates.ts`. Human reference: [GDPR_COMPLIANCE.md](../GDPR_COMPLIANCE.md).

## Admin auth (canonical)

**Only** native form `POST` → `app/admin/login/submit/route.ts` → `signInWithPassword` via server client → cookies on **same 303 response**.

Never browser `signInWithPassword` + `router.push` (cookie race / redirect loops).

`setAll` must pass Supabase `options` unchanged. Forward `@supabase/ssr` ≥ 0.12 cache headers on all `setAll` sites.

`proxy.ts` copies refreshed cookies onto **every** redirect branch.

**Login hardening:** the submit route is rate-limited per-IP (fail-closed) and adds a small delay on failed sign-in. It does **not** modify `profiles.role` — admin rows are created in Supabase, never auto-promoted.

**Form gotcha:** Do not `disabled` email/password inputs during submit — only disable the submit button.

Enable Supabase **Auth MFA (TOTP)** for the admin account in the dashboard.

**Change-password** (`/admin/security`): the admin can change their own password in-app. Server action `app/admin/_actions/changePassword.ts` → `requireAdmin()` → verifies `current` via `signInWithPassword` (session email/phone) → `auth.updateUser({ password: next })`. Enforces min-8 chars, match, and new≠current. **MFA-lenient:** if verification fails with an MFA/TOTP error, we proceed anyway because the signed-in session already passed the MFA challenge — an MFA-enabled admin is not blocked. For a change-password from a non-session context (e.g. forgotten password), use the Supabase dashboard (Auth → Users).

## Environment

Document and fail fast on missing security-critical env vars (`RATE_LIMIT_SALT`, Supabase keys, `SECRETS_ENCRYPTION_KEY`).

> This project does **not** use Vercel cron triggers (Vercel Free — no `crons` block in `vercel.json`). `CRON_SECRET` is optional, used only by the internal async sync-job continuation (`lib/sync-job-chain.ts`) bearer fallback, not by any Vercel scheduler.

## CSP (`unsafe-inline` styles)

Production CSP in `vercel.json` includes `style-src 'self' 'unsafe-inline'`. Required for Tailwind runtime classes and inline theme CSS variables. **Accepted risk** (TD-004): no third-party style injection surface; `script-src` includes `'self' 'unsafe-inline' 'unsafe-eval'` (Next runtime) — tighten when possible.

## SSRF

`app/api/partner-logo/route.ts` and the admin media-fetch actions use `lib/ssrf-guard.ts` (`assertSafeRemoteUrl`): block private/metadata hosts, resolve DNS before fetch, protocol allowlist. `lib/remote-image-url.ts` shares the host blocklist for client-side URL validation.

## URLs — scheme hardening

User/admin-supplied URLs are constrained to `http`/`https`:
- Write-time: a shared `safeExternalUrl`/`safeExternalUrlOptional` guard (`lib/safe-external-url.ts`) on all external-URL schemas/actions (social, partners, gigs, merchandise, soundpacks, media downloads, music highlights, release streaming/custom links, visuals, footer legal).
- Render-time: `sanitizeExternalHref` (`lib/sanitize-href.ts`) on every DB-backed `<a href>`/download link as defense-in-depth.
- This blocks `javascript:`/`data:`/`vbscript:` click-to-XSS.

## Config

`env.mjs` validates server env vars and fails fast in production.
