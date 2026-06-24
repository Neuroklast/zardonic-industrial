# Security & GDPR

## Embeds (TTDSG / GDPR)

Spotify, YouTube, SoundCloud: **never** auto-load. Two-click consent before `<iframe>`.

## Storage & consent

- Analytics / tracking localStorage: gated by `CookieConsent` + `lib/consent.ts`
- Functional prefs (theme, locale, sound): permitted without analytics consent
- Import consent helpers from `@/lib/consent`, not from `CookieConsent` in non-UI modules

## Data minimization

Never log plaintext IPs — use `hashIp()` where server-side identification is needed.

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