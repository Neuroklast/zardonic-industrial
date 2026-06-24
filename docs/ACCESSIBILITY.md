# Accessibility — ZARDONIC Band Website

**Last updated:** 2026-06-24

## Status

| Level | Status |
|-------|--------|
| WCAG 2.1 A | Compliant |
| WCAG 2.1 AA | Mostly compliant |
| WCAG 2.1 AAA | Partial |

## Implemented

1. **Semantic HTML** — `nav`, `main`, `section`, `article`, `footer` on public pages
2. **Skip link** — `PageLayout` provides “Skip to content” (`layouts/PageLayout.tsx`)
3. **Keyboard navigation** — Interactive elements are focusable and operable via keyboard
4. **Focus indicators** — Visible focus rings on interactive elements
5. **Alt text** — Images use descriptive `alt` where meaningful
6. **ARIA labels** — Buttons and icon-only controls have accessible names; nav uses `ariaLabel()` from `lib/i18n.ts`
7. **Touch targets** — Minimum ~44×44 px on mobile controls (e.g. `SiteNav` hamburger)
8. **Color contrast** — Crimson-on-black theme meets AA for primary text
9. **Motion controls** — Glitch, scanline, CRT, noise, and circuit effects toggleable in admin
10. **Cookie consent** — Keyboard-accessible; links to Privacy Policy
11. **`prefers-reduced-motion`** — Global CSS disables decorative motion; Framer Motion sections use `useReducedMotion`
12. **Modal focus trap** — `CyberpunkOverlay` traps Tab, closes on Escape, restores focus to trigger

## Open improvements

| Item | Notes |
|------|-------|
| Screen reader labels | Complex glitch/HUD elements may need more descriptive labels |
| i18n coverage | ARIA helpers exist; not every overlay control is localized yet |

## Admin configuration

Site administrators can disable visual effects that may affect vestibular sensitivity:

- Phosphor glow, scanlines, HUD metadata, cursor animations, image glitch, text decryption

Configure under `/admin/site-config` → Appearance / Effects.

## Testing recommendations

1. Screen readers (NVDA, JAWS, VoiceOver)
2. Keyboard-only navigation
3. Browser zoom at 200%
4. Color blindness simulators
5. Automated tools (axe, Lighthouse)