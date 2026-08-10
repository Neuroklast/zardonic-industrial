# QA Checklist — Zardonic Industrial

Manual smoke checks for agents and humans after public / admin changes.  
Update this file when user-visible flows change (`docs/agent/workflow.md`).

---

## Public homepage

- [ ] Hero loads; primary CTAs visible and tappable (min 44px)
- [ ] Hero wordmark boot (~1s scan + mini bar under logo) plays when hero is on-screen; not a full-page loader
- [ ] Hero size slider: large rem values can fill content width (page margins only); no ~900px artificial cap
- [ ] Nav logo full size; every section has a desktop **icon** (BIO not missing)
- [ ] Desktop: hover/focus icon → glitch to short label; mobile: icon + text
- [ ] Hover labels are short (Bio / Releases / …), not full section titles
- [ ] Smooth scroll to sections works (Lenis); mobile hamburger works
- [ ] Releases: open detail → **CyberpunkOverlay** chrome (corners, label, close)
- [ ] Events/gigs: same overlay system as releases
- [ ] Gallery: open image → **same** overlay shell as releases (not a bare lightbox)
- [ ] Gallery: page does not scroll away under the modal; Escape closes
- [ ] Credits / endorsements / partners: logos white-on-dark, **no solid white rectangles**
- [ ] Footer: social icons readable size; legal links not micro-type; wrap on narrow screens
- [ ] Cookie banner / preferences still reachable; Reject focuses first action; Escape closes customize
- [ ] Legal Notice + Privacy Policy routes render from Supabase legal config (EN + DE via language switcher)
- [ ] Incomplete legal fields: admin checklist red + public notice; complete: no warning
- [ ] Network: no request to fonts.googleapis.com / fonts.gstatic.com on cold load
- [ ] Analytics Reject → no POST /api/analytics; Accept → events only after consent

## Public browse

- [ ] `/releases` list + overlay
- [ ] `/gigs` list + overlay
- [ ] Pagination / empty states do not break layout

## Admin (smoke)

- [ ] Login works; protected routes redirect when logged out
- [ ] Site config / sections draft does not break public nav labels
- [ ] Partner edit: logo upload + white-logo toggle
- [ ] Legal admin saves and public pages reflect changes after revalidate

## After deploy

- [ ] Production deployment SHA matches expected merge commit
- [ ] Hard refresh (Ctrl+Shift+R) on a cold tab
- [ ] Re-check the exact bugs the user reported (not only “page loads”)

---

## Regression notes (hot)

| Bug | Expected after fix |
|-----|--------------------|
| `…ography` / BIO under logo | Flex logo + compact nav labels |
| Gallery “different” modal | `type: 'gallery'` → `CyberpunkOverlay` |
| White PNG box (e.g. QUESTEC) | Canvas silhouette; no CSS invert on plates |
| Tiny footer | Icons ≥28px; legal ≥ text-sm |
