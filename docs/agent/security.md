# Security & GDPR

## Embeds (TDDDG / GDPR)

Spotify, YouTube, SoundCloud: **never** auto-load. Two-click consent before `<iframe>`.

## Public forms

- Contact + newsletter: honeypot (`_hp`), Zod validation, Resend delivery
- Rate limits via `lib/server-rate-limit.ts` (Upstash, hashed IP + `RATE_LIMIT_SALT`)
- Newsletter: double opt-in + explicit privacy consent checkbox
- Contact: privacy-policy notice next to submit (Art. 6(1)(b)/(f))

## Storage & consent

- Analytics / tracking localStorage: gated by `CookieConsent` + `lib/consent.ts`
- Functional prefs (theme, locale, sound): permitted without analytics consent
- Import consent helpers from `@/lib/consent`, not from `CookieConsent` in non-UI modules

## Data minimization

Never log plaintext IPs — use hashed IPs (`lib/server-rate-limit.ts` / legacy `hashIp`) where server-side identification is needed. Contact form must not log email/name in production.

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

**Form gotcha:** Do not `disabled` email/password inputs during submit — only disable the submit button.

## Environment

Document and fail fast on missing security-critical env vars (`RATE_LIMIT_SALT`, Supabase keys, etc.).

Legacy `api/_ratelimit.ts` **fails closed (503)** when Upstash is configured but unreachable. Production `ENOTFOUND` on `*.upstash.io` means the Redis database was deleted/renamed — update `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or remove both to skip rate limiting in non-prod only).

## CSP (`unsafe-inline` styles)

Production CSP in `vercel.json` includes `style-src 'self' 'unsafe-inline'`. Required for Tailwind runtime classes and inline theme CSS variables. **Accepted risk** (TD-004): no third-party style injection surface; script-src remains restricted.

## SSRF (image proxies)

`api/image-proxy.ts` and `api/image-proxy-protected.ts` use `lib/ssrf-guard.ts`: block private/metadata hosts, resolve DNS before fetch, re-check redirect targets. `lib/remote-image-url.ts` shares host blocklist for client-side URL validation.

`app/api/partner-logo/route.ts` is allowlisted to R2 / Supabase **HTTPS SVGs** (`parsePartnerLogoProxyUrl`) **and** `assertSafeRemoteUrl` before fetch. Do not widen to arbitrary hosts.

## Legacy auth

`api/auth.ts` and `x-session-token` header flow **removed**. Admin auth is Supabase SSR only (`app/admin/login/submit/route.ts`).