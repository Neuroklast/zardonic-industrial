# Operator Launch Checklist — Legal & Privacy

Manual steps that **cannot** be automated by deploy. Complete before advertising the site as production-ready under German/EU law.

> Code provides templates, consent, two-click embeds, and admin completeness UI.  
> You still must fill real data and sign processor agreements.

## 1. Legal identity (required)

1. Open **Admin → Legal & Privacy**
2. Fill all green checklist items:
   - Operator name
   - Street & number (ladungsfähige Anschrift)
   - ZIP + city
   - Email
   - Responsible person (or rely on operator name fallback)
3. Open public `/legal-notice` and `/privacy-policy` (DE + EN via language switcher)
4. Confirm **no** “please configure” / incomplete banners for production

## 2. Processor agreements (DPA / AVV)

Sign / accept data processing terms in each dashboard:

| Processor | Purpose |
|-----------|---------|
| Vercel | Hosting |
| Supabase | DB + admin auth |
| Cloudflare R2 | Media |
| Resend | Contact + newsletter email |

Prefer **EU regions** where the product allows (Supabase project region, R2 location).

## 3. Analytics

1. Admin → Analytics: understand master switch **and** cookie opt-in
2. Hard-refresh public site → **Reject all** → Network: no `POST /api/analytics`
3. Accept analytics → events appear only after consent
4. Plan retention purge (~90 days) for `analytics_events`

## 4. Fonts / third parties

- Default fonts are **self-hosted** (no Google Fonts request)
- Theme font picker only offers privacy-safe stacks
- Spotify/YouTube embeds load only after two-click consent
- SoundCloud is link-only (no auto embed)

## 5. Rate limiting (Supabase Postgres)

Rate limiting runs on the existing Supabase Postgres (`lib/rate-limit.ts`, `supabase/schema.sql` `consume_rate_limit`). No Redis is required.

1. Set `RATE_LIMIT_SALT` (32-byte hex) in Vercel → Project → Settings → Environment Variables
2. Run `supabase/schema.sql` in the Supabase SQL Editor so the `public.rate_limits` table + `consume_rate_limit()` function exist
3. Redeploy production (env changes do not apply to the live deployment until redeploy)
4. Confirm `GET /api/geo` returns 200 and rate-limited routes respond 429 when exceeded

## 6. Production verify

1. Deploy SHA matches expected `main` merge
2. Hard refresh (Ctrl+Shift+R)
3. Run through `QA_CHECKLIST.md` public smoke

## 7. R2 bucket CORS (browser uploads)

Admin **video uploads** and `/admin/media` press-kit downloads PUT to R2 **from the browser**, which needs a bucket CORS policy — otherwise uploads fail with `net::ERR_FAILED` / "failed to fetch" even though the presigned URL is valid.

1. Cloudflare Dashboard → **R2 → bucket → Settings → CORS Policy**
2. Ensure methods include `PUT` and headers allow `Content-Type` (+ `ETag` exposed for multipart). See [`r2-cors.json`](../r2-cors.json)
3. Add the admin origin: `http://localhost:3000` for local dev, your Vercel/preview origins, or `*` for a private presigned-only media bucket
4. Confirm `Admin → API Health` shows **R2 bucket CORS** OK (read-only check)
5. If you serve via an R2 **custom domain**, purge its cache after editing CORS

## Disclaimer

Built-in DE/EN legal templates are **operational drafts**, not a substitute for lawyer review for your specific entity (sole trader vs. company, VAT, MStV, etc.).
