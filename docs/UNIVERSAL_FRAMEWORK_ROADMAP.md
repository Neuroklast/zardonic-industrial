# Roadmap: Universal Web Agency Framework (Gold Standard)

Dieses Dokument beschreibt die notwendigen Schritte, um die bestehende "Zardonic/Band"-Codebase in ein universelles, hochperformantes und extrem sicheres Framework für Web-Agenturen umzuwandeln. Das Ziel ist es, dieses Framework für Shops, Firmen, Portfolios und andere Web-Apps mit Top-Animationen (React, Tailwind, Framer Motion, Three.js) zu nutzen.

## 1. Entkopplung von domänenspezifischer Logik (De-Zardonic-ification)

Aktuell enthält die Codebase harte Koppelungen an eine Musik-/Band-Domäne. Diese müssen abstrahiert werden:

- **Entfernung harter Strings:** Ersetzen aller Vorkommen von "Zardonic" (z.B. in `src/lib/spotify-releases.ts`, `src/lib/itunes.ts`, `api/gigs-sync.ts`) durch dynamische Tenant- oder Konfigurations-Parameter.
- **Domänen-agnostische Datenmodelle:** Das `SiteData` Interface in `src/lib/app-types.ts` ist stark auf Musik (`gigs`, `tracks`, `releases`) fokussiert. Dieses Modell muss so verallgemeinert werden, dass es für verschiedene Branchen (z.B. `products` für Shops, `services` für Firmen) via Sanity CMS konfigurierbar ist.
- **Konfigurierbares 3D-Logo:** Das spezifische `ZARDONICTEXT.glb` und die harte Verknüpfung in `Logo3D.tsx` müssen durch einen allgemeinen Asset-Loader ersetzt werden, der Modelle via CMS oder Konfiguration lädt.
- **Austauschbare Module:** APIs wie Bandsintown und iTunes müssen als optionale "Plugins" oder Module (Feature-Flags) strukturiert werden, die für Nicht-Musik-Kunden deaktiviert bleiben.

## 2. Architektur & Struktur (Gold Standard)

Basierend auf den Erkenntnissen des `docs/DEEP_AUDIT.md` (z.B. A-01: God Object `App.tsx`, fehlendes Routing) ist eine Umstrukturierung unabdingbar:

- **Einführung eines Routers (React Router v7 / TanStack Router):** Übergang von einer Single-Page-App ohne URL-Zustand zu einer echten Multi-Page-Architektur. Dies ermöglicht Route-basiertes Code-Splitting, was die initiale Ladezeit massiv verringert.
- **State Management mit Zustand:** Das bisherige Prop-Drilling in `App.tsx` auflösen. Globaler State (Auth, Theme, Site Config) muss in isolierten Zustand-Stores verwaltet werden.
- **Feature-basierte Ordnerstruktur:** Abkehr von der flachen Komponentenstruktur (aktuell >70 Dateien in `src/components`). Nutzung einer Feature-Slice-Architektur (z.B. `src/features/auth`, `src/features/ecommerce`, `src/features/cms`).
- **Auflösung von God Objects:** Riesige Komponenten wie `EditControls.tsx` (>1000 Zeilen) müssen in kleine, domänenspezifische Sub-Komponenten zerlegt werden (Single Responsibility Principle).

## 3. Performance-Optimierung

Damit Top-Animationen performant bleiben, müssen Ladezeiten optimiert werden:

- **Lazy Loading & Suspense:** Schwere Abhängigkeiten wie `three` (Three.js), `framer-motion`, `d3` und `recharts` dürfen nicht eager geladen werden. Umsetzung durch dynamische Imports (`React.lazy`).
- **Verzicht auf JavaScript Obfuscation:** Der `javascript-obfuscator` im Build-Prozess (Performance-Bug G-01) vergrößert das Bundle um bis zu 80% und zerstört das Tree-Shaking. Die Sicherheit muss auf Server-Ebene gewährleistet werden.
- **Optimierung des Loading Screens:** Das 3D-Loading-Screen blockiert aktuell das Largest Contentful Paint (LCP). Es muss durch einen leichten CSS-Loader ersetzt werden, während Three.js im Hintergrund asynchron initialisiert.

## 4. Sicherheit (Extrem Sicher)

Die Codebase verfügt bereits über offensive Sicherheitsfeatures (Honeypots, Zipbombs, Threat Scoring). Diese müssen in ein sicheres, modulares System überführt werden:

- **Rechtliche Absicherung / Modulare Offensive:** Die offensiven Mechanismen (`_zipbomb.ts`, `_sql-backfire.ts`) bergen rechtliche Risiken (z.B. nach § 202c StGB). Sie müssen über Feature-Flags steuerbar sein, damit Kunden selbst entscheiden können, ob sie diese aktivieren.
- **CSP (Content Security Policy) Härtung:** Das aktuelle `unsafe-inline` für Styles muss entfernt werden (z.B. durch Nonces oder Hash-Generierung im Build).
- **ESLint für das Backend:** Der Ordner `api/` ist derzeit von ESLint ausgenommen. Dies muss geändert werden, um Typen- und Logikfehler in den Serverless Functions statisch zu fangen.
- **Strikter TypeScript Build:** Entfernung des `tsc --noCheck` Flags im Build-Prozess.

## 5. Software Quality & Testing

Ein Gold-Standard-Framework benötigt ein wasserdichtes Test-Netz:

- **E2E Testing (Playwright):** Kritische User-Flows (Login, Admin-Setup, Kontaktformular, Checkout-Dummy) müssen automatisiert getestet werden.
- **Komponenten-Tests:** Erhöhung der Test Coverage von aktuell fast 0% für UI-Komponenten mithilfe von Vitest und React Testing Library.
- **Visual Regression Testing:** Automatisierte Checks für verschiedene Viewports (Mobile, Tablet, Desktop) und Theme-Variationen.
- **Semantische Versionierung:** Einführung eines strukturierten Release-Prozesses (SemVer) und eines Changelogs.

## 6. Vorbereitung für Shops, Firmen etc.

Um eine wirkliche Universalität zu erreichen, müssen weitere Features hinzugefügt werden:

- **E-Commerce Integration:** Vorbereitung von abstrakten Interfaces für Headless-Commerce (z.B. Shopify, Medusa, Stripe), die per Plug & Play aktiviert werden können.
- **Dynamisches Theming System:** Die Cyberpunk-Effekte (CRT, Scanlines, Glitch) müssen leicht abschaltbar sein, und das Theme-System muss von "Dark Industrial" auf "Corporate Clean" wechseln können, ohne CSS umzuschreiben.
- **Modulare Landingpage-Blöcke:** Entwicklung von universell einsetzbaren Sektionen (z.B. "Testimonials", "Pricing", "Features"), die über Sanity konfiguriert werden.

## Zusammenfassung

Durch die Umsetzung dieses Roadmaps verwandelt sich die bestehende, stark individualisierte Zardonic-Website in eine robuste, skalierbare und branchenübergreifende Plattform. Der Fokus liegt dabei auf der Modularisierung von Inhalten, der Einführung eines strikten Feature-Splits sowie der Behebung historisch gewachsener Performance- und Architekturdefizite.
