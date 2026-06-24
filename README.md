# ZARDONIC — Industrial Cyberpunk Artist Website

A cyberpunk-themed artist website for **ZARDONIC**, built on **Next.js App Router**, **Supabase**, and **Cloudflare R2**. React 19, TypeScript, Tailwind CSS 4, and Framer Motion power the 3D loading screen, glitch effects, and admin CMS.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fzardonic-industrial&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,R2_ACCOUNT_ID,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY,R2_BUCKET_MEDIA,R2_PUBLIC_HOST,NEXT_PUBLIC_SITE_URL&envDescription=Core%20Supabase%20and%20R2%20variables%20for%20the%20App%20Router%20site&envLink=https%3A%2F%2Fgithub.com%2FNeuroklast%2Fzardonic-industrial%2Fblob%2Fmain%2F.env.example&project-name=zardonic-industrial&repository-name=zardonic-industrial)

> **Live Site:** https://zardonic-website.vercel.app  
> **Coding agents:** Start with [`AGENTS.md`](./AGENTS.md) and [`docs/agent/`](./docs/agent/) — then [`docs/DEVELOPMENT_STATUS.md`](./docs/DEVELOPMENT_STATUS.md) for sprint context.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

---

## Features

### Public Site
- **3D Loading Screen** — Three.js model loading with real progress tracking and IndexedDB image pre-caching
- **Glitch Logo** — Hero logo with chromatic aberration RGB channel separation and jitter effects
- **Cyberpunk UI** — Scanline overlays, CRT effects, noise grain, circuit board background (all toggleable)
- **Spotify Integration** — GDPR-compliant two-click embedded Spotify player with dynamic CI colour-theming
- **LLM Discoverability** — `public/llm.txt` served at `/llm.txt`
- **iTunes & Bandsintown Sync** — Automatic release and tour date fetching with Odesli cross-platform links
- **Release Detail Overlay** — Cyberpunk animated detail overlay with cover art, links, and track metadata
- **Responsive Gallery** — Swipeable image gallery with lightbox; Google Drive URL support via wsrv.nl proxy
- **Social Connect** — Instagram, Facebook, Spotify, YouTube, SoundCloud, TikTok, and more
- **News & Partners** — News section and partner/sponsors showcase
- **Contact & Newsletter** — Contact form (Resend) and newsletter signup
- **Legal Notice & Privacy Policy** — `/legal-notice` and `/privacy-policy` (English, GDPR/DDG templates); editable in `/admin/legal`
- **Secret Terminal** — Konami code–activated terminal interface

### Admin CMS
Access the admin at `/admin/login` using Supabase Auth; protected routes require `profiles.role = admin`.

- **Section Visibility** — Show/hide any section (Bio, Music, Gigs, Releases, Gallery, Connect, Credits)
- **Theme Customization** — Colors, fonts, and favicon uploads stored in R2
- **Animation Controls** — Toggle glitch, scanline, chromatic, CRT, noise, and circuit effects
- **Legal & Privacy** — Structured operator fields and optional privacy policy override (`site_config.legal`)
- **Contact Inbox & Subscribers** — View/manage contact submissions and newsletter subscribers
- **Data Export/Import** — Export and restore site data as JSON
- **Security Dashboard** — Incident log, attacker profiles, blocklist (legacy `api/` stack)

### Backend
- **App Router** — Server Components, Server Actions, Route Handlers under `app/`
- **Supabase** — Primary content store (`releases`, `gigs`, `site_config`, etc.)
- **Cloudflare R2** — Media uploads via presigned URLs
- **Legacy `api/`** — Upstash Redis endpoints for security, sync workers, and analytics (being phased out where App Router replaces them)

### Data Persistence
- **Supabase PostgreSQL** — Site content, configuration, legal data, admin profiles
- **Cloudflare R2** — Uploaded images, videos, favicons
- **Upstash Redis** — Rate limiting, security stack, legacy sync queues (`api/`)
- **IndexedDB** — Image pre-caching during loading screen

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion, Three.js |
| Data | Supabase (PostgreSQL + Auth), Cloudflare R2 |
| Email | Resend |
| Legacy APIs | Vercel Serverless Functions in `api/` (Upstash Redis) |
| UI | Radix UI, Phosphor Icons, Sonner |
| Testing | Vitest |
| Deployment | Vercel |

---

## Development

```bash
npm install
cp .env.example .env   # fill in Supabase + R2 keys
npm run dev
```

The runtime lives under `app/`, `components/`, `lib/`, `layouts/`, and related root folders. The `src/` tree is a legacy mirror kept for reference during migration — prefer root imports used by Next.js.

Session gate before merging:

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

---

## Environment Variables

Copy [`.env.example`](./.env.example) to `.env`. Core variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side Supabase access |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | ✅ | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 API secret |
| `R2_BUCKET_MEDIA` | ✅ | R2 bucket name |
| `R2_PUBLIC_HOST` | ✅ | Public R2 CDN host |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site URL |
| `RESEND_API_KEY` | ⚠️ | Contact form / newsletter email |
| `CONTACT_EMAIL` | ⚠️ | Contact form recipient |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Legacy `api/` rate limiting & security |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | Upstash auth token |
| `RATE_LIMIT_SALT` | ⚠️ | IP hashing salt (required in production) |
| `CRON_SECRET` | ⚠️ | Cron job authentication |
| `BANDSINTOWN_API_KEY` | Optional | Tour date sync |
| `SPOTIFY_CLIENT_ID` / `SECRET` | Optional | Spotify catalogue sync |
| `DISCORD_WEBHOOK_URL` | Optional | Security alert notifications |

See [SECURITY.md](./SECURITY.md) for the full security-related variable list.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run test` | Vitest test suite |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:types` | Generate Supabase types → `lib/database.types.ts` |
| `npm run migrate` | Seed/migrate site data to Supabase |

---

## Deployment

Deploy to **Vercel**. App Router routes under `app/` deploy automatically; legacy functions in `api/` are still deployed as serverless endpoints.

> **Custom domain:** Use a canonical custom domain in production. The `.vercel.app` staging URL may trigger bounce-tracking warnings in some browsers.

### First-time Admin Setup

1. Deploy with Supabase and R2 environment variables configured
2. Run [`supabase/schema.sql`](./supabase/schema.sql) (or `npm run migrate`) against your Supabase project
3. Create an admin user in Supabase Auth and set `profiles.role = 'admin'`
4. Log in at `https://your-domain.com/admin/login`

---

## Documentation

Canonical index: **[`docs/README.md`](./docs/README.md)**

| Document | Description |
|----------|-------------|
| [AGENTS.md](./AGENTS.md) | Agent session gate and links |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, routes, data stores |
| [docs/ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md) | Admin panel usage |
| [docs/GDPR_COMPLIANCE.md](./docs/GDPR_COMPLIANCE.md) | Privacy and processors |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

Historical docs (Vite SPA, Sanity draft, one-off audits) live in [`docs/archive/`](./docs/archive/) — do not use for current development.

---

## License

MIT License — see [LICENSE](LICENSE) for details.