# GDPR Compliance Review — ZARDONIC Band Website

**Last updated:** 2026-06-24

## Overview

This document reviews the GDPR compliance status of the ZARDONIC band website (Next.js App Router, Supabase, Cloudflare R2).

## Public legal pages

| Route | Content |
|-------|---------|
| `/legal-notice` | Operator details from `site_config.legal`, DDG/MStV boilerplate (English) |
| `/privacy-policy` | GDPR template (Vercel, Supabase, R2, Resend, wsrv.nl, cookies, contact, newsletter, embeds); override via `privacyPolicyCustom` |
| Cookie banner | Links to `/privacy-policy`; footer offers Cookie Preferences |
| Admin | `/admin/legal` — structured operator fields + optional privacy override |

Legacy paths `/impressum`, `/privacy`, `/datenschutz` redirect to the routes above.

## Data collection & processing

### Compliant features

1. **Cookie consent** — `CookieConsent` component; users accept or reject non-essential storage; link to Privacy Policy
2. **Minimal third-party tracking** — No advertising or analytics cookies; no third-party tracking pixels
3. **Transparent processing** — Privacy Policy describes processors and purposes
4. **User rights** — Cookie preferences revocable from footer; browser data clearable by user; contact form for data requests (see Privacy Policy)

### Primary data stores (Supabase)

| Data | Purpose | Legal basis |
|------|---------|-------------|
| `site_config` | Theme, footer, legal text, catalogue sync IDs | Legitimate interest / contract (site operation) |
| `releases`, `gigs`, `gallery`, etc. | Public site content | Legitimate interest |
| `contact_submissions` | Contact form messages | Consent / pre-contractual steps |
| `newsletter_subscribers` | Newsletter signups | Consent |
| `profiles` | Admin authentication role | Contract (admin access) |

Supabase region and DPA: configure in Supabase dashboard; referenced in Privacy Policy template.

### Media & email processors

| Processor | Data | Purpose |
|-----------|------|---------|
| Cloudflare R2 | Uploaded media (images, video, favicon) | CDN hosting |
| Resend | Email address, message body (contact/newsletter) | Transactional email |
| Vercel | Request logs, deployment metadata | Hosting |

### Client-side storage

| Store | Data | Purpose |
|-------|------|---------|
| `localStorage` | Cookie consent choice, UI preferences | Consent / user preference |
| IndexedDB | Image pre-cache during loading screen | Performance (essential) |

No admin credentials are stored in the browser. Admin auth uses Supabase SSR session cookies.

### Legacy server-side data (Upstash Redis — `api/`)

Still used for security and sync workers not yet migrated to App Router:

| Key pattern | Data | Retention |
|-------------|------|-----------|
| `zd-rl:*` | Hashed IP rate-limit counters | ~60 s window |
| `zd-threat:*`, `zd-blocked:*` | Hashed IP threat scores / blocks | 1 h – 7 d TTL |
| `zd-honeytoken-alerts` | Security incident log (hashed IPs) | Rolling 500 entries |
| `zd-profile:*` | Attacker behavioural aggregates (hashed IPs) | 30 d TTL |

IP addresses are pseudonymised (SHA-256 + `RATE_LIMIT_SALT`) before storage. Legal basis: Art. 6(1)(f) — legitimate interest in IT security.

### External APIs (server-side)

| API | Data sent | Purpose |
|-----|-----------|---------|
| iTunes / Spotify / Discogs | Artist/release IDs, public metadata | Catalogue sync |
| Bandsintown | Artist ID | Tour dates |
| Odesli | Release URLs | Streaming link enrichment |
| wsrv.nl | Image URLs (public images only) | Image optimisation proxy |

## GDPR rights implementation

| Right | Implementation |
|-------|----------------|
| Access | Contact operator via Legal Notice; admin can export JSON |
| Erasure | Admin can delete submissions; security data auto-expires |
| Rectification | Admin updates content via `/admin` |
| Portability | JSON export/import in admin |
| Object | Cookie consent reject; no non-essential tracking |
| Transparency | Privacy Policy + Legal Notice |

## Security measures (Art. 32)

| Measure | Implementation |
|---------|----------------|
| Admin auth | Supabase Auth + `profiles.role` check |
| Session cookies | HttpOnly, Secure, SameSite (Supabase SSR) |
| Input validation | Zod on API routes and server actions |
| Rate limiting | Upstash Redis, hashed IPs |
| CSP / headers | `vercel.json` + `next.config.mjs` parity |
| Transport | HTTPS, HSTS |

## Compliance status

**Overall: Good** — transparent policies, consent for cookies, Supabase as primary store with documented processors, pseudonymised security logging, automatic TTL on security data.

## Contact

For GDPR-related questions, see the [Legal Notice](/legal-notice) and [Privacy Policy](/privacy-policy).