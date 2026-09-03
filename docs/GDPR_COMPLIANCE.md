# GDPR Compliance Review — ZARDONIC Band Website

**Last updated:** 2026-08-09 (audit remediation)

## Overview

This document reviews the GDPR compliance status of the ZARDONIC band website (Next.js App Router, Supabase, Cloudflare R2).

## Public legal pages

| Route | Content |
|-------|---------|
| `/legal-notice` | Operator details from `site_config.legal`, DDG/MStV boilerplate (**EN + DE** via site locale) |
| `/privacy-policy` | GDPR/BDSG/TDDDG template (Vercel, Supabase, R2, Resend, wsrv.nl, self-hosted fonts, analytics 90d retention, contact, newsletter, two-click embeds); override via `privacyPolicyCustom` |
| Cookie banner | Opt-in analytics; links to `/privacy-policy`; footer Cookie Preferences |
| Admin | `/admin/legal` — structured fields + **completeness checklist** + optional custom override |

Legacy paths `/impressum`, `/privacy`, `/datenschutz` redirect to the routes above.

**Operator actions:** see [OPERATOR_LAUNCH_CHECKLIST.md](./OPERATOR_LAUNCH_CHECKLIST.md) (fill Impressum fields, sign DPAs, verify consent). Templates are drafts, not legal advice.

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
| Contact form (via Resend) | Contact form messages | Pre-contractual / legitimate interest (Art. 6(1)(b)/(f)) |
| `newsletter_subscribers` | Newsletter signups (double opt-in) | Consent (Art. 6(1)(a)) |
| `news_posts` | Public editorial news content | Legitimate interest (no personal data from readers) |
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

### Server-side rate-limiting data (Supabase Postgres)

Rate limiting uses the existing Supabase Postgres (`public.rate_limits`), not a separate store:

| Data | Retention |
|------|-----------|
| Hashed IP rate-limit counters (`SHA-256(RATE_LIMIT_SALT + IP)`) | expires after each fixed window |

Client IPs are pseudonymised (SHA-256 + `RATE_LIMIT_SALT`) before storage — no plaintext IPs are persisted. Legal basis: Art. 6(1)(f) — legitimate interest in IT security.

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

**Overall: Good+** — bilingual legal templates, self-hosted fonts (no Google Fonts CDN), consent for analytics, two-click embeds, admin legal completeness UI, documented processors + 90-day analytics retention language. Remaining: operator must complete real identity data + DPAs; lawyer review recommended for DE production.

## Contact

For GDPR-related questions, see the [Legal Notice](/legal-notice) and [Privacy Policy](/privacy-policy).