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

## 5. Production verify

1. Deploy SHA matches expected `main` merge
2. Hard refresh (Ctrl+Shift+R)
3. Run through `QA_CHECKLIST.md` public smoke

## Disclaimer

Built-in DE/EN legal templates are **operational drafts**, not a substitute for lawyer review for your specific entity (sole trader vs. company, VAT, MStV, etc.).
