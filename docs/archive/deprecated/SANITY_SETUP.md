> **DEPRECATED** — Historical document from a prior stack era. Do not use for current development. See [docs/README.md](../../README.md).

# Sanity CMS – Schritt-für-Schritt Einrichtung

## Übersicht

Diese Anleitung führt dich durch die vollständige Einrichtung von **Sanity.io** als Content Management System für **Zardonic Industrial**. Nach Abschluss dieser Anleitung wirst du:

- Ein laufendes Sanity Studio haben (gehostet auf sanity.io oder selbst gehostet)
- Alle Content-Schemas bereit zum Befüllen haben
- Die automatische Synchronisation von iTunes-Releases und Bandsintown-Events eingerichtet haben
- Die Frontend-Website mit Daten aus Sanity versorgt haben

---

## Voraussetzungen

- **Node.js** ≥ 18
- **npm** ≥ 9
- Ein **Sanity.io** Konto (kostenlos: https://www.sanity.io/get-started)
- Ein **Vercel** Konto (für Deployment)
- **Bandsintown API Key** (https://www.bandsintown.com/for-artists)

---

## Schritt 1: Sanity Projekt initialisieren

Das Projekt ist bereits konfiguriert (Project ID: `unz85dqo`, Dataset: `production`).

Falls du es lokal klonen möchtest:

```bash
# Im Projektverzeichnis:
npm install
```

Die Schemas liegen unter `sanity/schemas/` und die Konfiguration in `sanity.config.ts`.

---

## Schritt 2: Sanity API Token erstellen

1. Gehe zu https://www.sanity.io/manage/project/unz85dqo
2. Klicke auf **API** → **Tokens** → **Add API token**
3. Erstelle einen Token mit folgenden Einstellungen:
   - **Label:** `Vercel Backend`
   - **Permissions:** `Editor` (kann lesen + schreiben)
4. **Kopiere den Token** — du siehst ihn nur einmal!

---

## Schritt 3: Umgebungsvariablen konfigurieren

### Lokal (`.env`-Datei)

Kopiere `.env.example` nach `.env` und füge die Sanity-Variablen hinzu:

```bash
cp .env.example .env
```

Füge folgende Werte ein:

```env
# Sanity CMS (Public — eingebettet im Frontend-Bundle)
VITE_SANITY_PROJECT_ID=unz85dqo
VITE_SANITY_DATASET=production

# Sanity API Token (Server-Side — NIE im Frontend exponieren!)
SANITY_API_TOKEN=<dein-token-von-schritt-2>

# Optional: Webhook-Secret für Cache-Revalidierung
SANITY_WEBHOOK_SECRET=<ein-zufälliger-string>
```

### Vercel (Produktions-Deployment)

1. Gehe zu https://vercel.com → Dein Projekt → **Settings** → **Environment Variables**
2. Füge hinzu:

| Variable | Wert | Environment |
|---|---|---|
| `VITE_SANITY_PROJECT_ID` | `unz85dqo` | Production, Preview, Development |
| `VITE_SANITY_DATASET` | `production` | Production, Preview, Development |
| `SANITY_API_TOKEN` | `<dein-token>` | Production, Preview |
| `SANITY_WEBHOOK_SECRET` | `<zufällig>` | Production |

---

## Schritt 4: Sanity Studio deployen

### Option A: Gehostet auf sanity.io (empfohlen)

```bash
# Sanity CLI installieren (falls nicht vorhanden)
npm install -g sanity@latest

# Studio deployen
npx sanity deploy
```

Wähle einen Hostnamen (z.B. `zardonic-cms`). Dein Studio wird dann erreichbar unter:
**https://zardonic-cms.sanity.studio/**

### Option B: Selbst gehostet im gleichen Vercel-Projekt

Das Studio kann auch als Route im bestehenden Projekt eingebettet werden.
Dafür wird eine separate Sanity Studio-Seite erstellt — Details auf Anfrage.

---

## Schritt 5: Sanity Studio öffnen und Inhalte anlegen

Öffne dein Sanity Studio (https://zardonic-cms.sanity.studio/ oder lokal via `npx sanity dev`).

### 5.1 Singletons anlegen

Diese Dokumente existieren nur einmal und müssen zuerst erstellt werden:

1. **Site Settings** → Klicke in der Sidebar auf "Site Settings"
   - Artist Name: `Zardonic`
   - Hero Image: Upload dein Hero-Bild
   - Bio: Deine Biografie
   - Social Links: Alle sozialen Netzwerke ausfüllen

2. **Admin Settings** → Klicke auf "Admin Settings"
   - Section Visibility: Welche Sektionen sichtbar sind
   - Theme: Farben und Fonts
   - Animations: Glitch, Scanline, CRT, etc.
   - Section Labels: Custom-Texte für Sektionsüberschriften
   - Contact Info: Management, Booking, Presse E-Mails

3. **Legal Content** → Klicke auf "Legal Content"
   - Impressum: Deine rechtlichen Angaben
   - Datenschutz: Deine Datenschutzerklärung

4. **HUD Texts** → Klicke auf "HUD Texts"
   - Die Terminal-HUD Overlay-Texte konfigurieren

### 5.2 Collections befüllen

1. **Releases** → "Release" → "Create new"
   - Titel, Artwork, Release-Datum, Streaming-Links
   - *Tipp: iTunes-Releases werden automatisch synchronisiert (siehe Schritt 6)*

2. **Gigs** → "Gig" → "Create new"
   - Venue, Location, Datum, Ticket-URL, Status
   - *Tipp: Bandsintown-Events werden automatisch synchronisiert*

3. **Members** → "Member" → "Create new"
   - Name, Foto, Rolle, Bio, Social Links
   - "Shell Section Member" aktivieren für Shell-Section

4. **Friends / Partners** → "Friend / Partner" → "Create new"
   - Name, Foto, Beschreibung, Social Links

5. **News** → "News Item" → "Create new"
   - Titel, Datum, Text, Bild, Link

6. **Gallery** → "Gallery Image" → "Create new"
   - Bild hochladen oder externen URL eingeben, Caption

7. **Media Files** → "Media File" → "Create new"
   - Audio, YouTube-Links, Downloads

8. **Credit Highlights** → "Credit Highlight" → "Create new"
   - Produktions-Credits, Remix-Credits

9. **Terminal Commands** → "Terminal Command" → "Create new"
   - Custom Befehle für das In-Site Terminal

---

## Schritt 6: Automatische API-Synchronisation einrichten

### 6.1 Vercel Cron Job (täglich)

Die `vercel.json` ist bereits konfiguriert:

```json
{
  "crons": [
    {
      "path": "/api/sanity-sync",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Der Cron Job läuft **täglich um 07:00 UTC** und:
- Ruft die **iTunes Search API** ab → erstellt neue Releases in Sanity
- Ruft die **Bandsintown REST API** ab → erstellt neue Gigs in Sanity
- Für jeden neuen iTunes-Release ruft er die **Odesli / song.link API** ab → füllt Spotify, YouTube, Deezer, etc. Links automatisch aus
- Aktualisiert den **Sync Log** in Sanity

### 6.2 Voraussetzungen für den Cron Job

Stelle sicher, dass folgende Variablen in Vercel gesetzt sind:

| Variable | Benötigt für |
|---|---|
| `CRON_SECRET` | Authentifizierung des Cron Jobs (automatisch von Vercel) |
| `SANITY_API_TOKEN` | Schreiben in Sanity |
| `BANDSINTOWN_API_KEY` | Bandsintown-Events abrufen |

### 6.3 Manueller Sync (Test)

Du kannst den Sync auch manuell auslösen:

```bash
curl -X GET "https://deine-domain.vercel.app/api/sanity-sync" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Schritt 7: Sanity Webhook einrichten (optional)

Für sofortige Updates bei Content-Änderungen:

1. Gehe zu https://www.sanity.io/manage/project/unz85dqo
2. Klicke auf **API** → **Webhooks** → **Create webhook**
3. Konfiguriere:
   - **Name:** `Vercel Revalidation`
   - **URL:** `https://deine-domain.vercel.app/api/sanity-webhook`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **Secret:** Derselbe Wert wie `SANITY_WEBHOOK_SECRET` in deinen Vercel-Variablen

---

## Schritt 8: CORS Origins konfigurieren

Damit das Frontend Daten von Sanity abrufen kann:

1. Gehe zu https://www.sanity.io/manage/project/unz85dqo
2. Klicke auf **API** → **CORS origins**
3. Füge hinzu:
   - `http://localhost:5173` (lokale Entwicklung)
   - `https://deine-domain.vercel.app` (Produktion)
   - `https://deine-custom-domain.com` (falls vorhanden)
4. **Allow credentials:** Nein (nicht nötig für öffentliche Reads)

---

## Schritt 9: Frontend-Integration testen

### Lokal testen

```bash
# Entwicklungsserver starten
npm run dev
```

Das Frontend lädt jetzt Daten aus Sanity statt aus Upstash Redis.

### Verifizieren

1. Öffne die Browser-Developer-Tools → Network-Tab
2. Du solltest Requests zu `unz85dqo.apicdn.sanity.io` sehen
3. Die Daten sollten im selben Format wie vorher ankommen

---

## Schritt 10: Sanity Studio lokal starten (Entwicklung)

```bash
# Sanity Studio lokal starten
npx sanity dev
```

Das Studio öffnet sich unter `http://localhost:3333`.

---

## Architektur-Übersicht

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Sanity Studio  │────▶│  Sanity Content   │◀────│   Vercel Cron Job   │
│ (zardonic-cms.   │     │     Lake          │     │  /api/sanity-sync   │
│  sanity.studio)  │     │  (unz85dqo)       │     │                     │
└─────────────────┘     └────────┬───────────┘     └──────────┬──────────┘
                                 │                            │
                                 │ GROQ Queries               │ Fetches from:
                                 │ (CDN cached)               │  • iTunes API
                                 ▼                            │  • Bandsintown API
                        ┌────────────────────┐                │  • Odesli API
                        │   React Frontend   │                │
                        │  (Vite SPA on      │                │
                        │   Vercel)          │                │
                        │                    │                │
                        │ src/lib/           │                │
                        │  sanity.client.ts  │                │
                        │  sanity.queries.ts │                │
                        │  sanity.loader.ts  │                │
                        └────────────────────┘                │
                                 │                            │
                                 │ Still uses:                │
                                 │  • wsrv.nl (image proxy)   │
                                 │  • /api/image-proxy        │
                                 ▼                            ▼
                        ┌────────────────────┐     ┌──────────────────┐
                        │   Upstash Redis    │     │  External APIs   │
                        │  (Rate Limiting,   │     │  iTunes, BIT,    │
                        │   Sessions,        │     │  Odesli, wsrv.nl │
                        │   Analytics)       │     └──────────────────┘
                        └────────────────────┘
```

### Was bleibt in Upstash Redis:
- Rate Limiting (IP-Hash basiert, GDPR-konform)
- Admin-Sessions (Cookies + Token)
- Analytics & Heatmap-Daten
- Blocklist & Attacker-Profile
- Image-Cache (Server-Side)

### Was in Sanity migriert wurde:
- Alle Content-Daten (Releases, Gigs, Members, Friends, News, Gallery, etc.)
- Admin-Einstellungen (Theme, Animations, Section Visibility, Labels, etc.)
- Legal Content (Impressum, Datenschutz)
- Terminal Commands
- HUD Texts
- Sync Timestamps

---

## Schemas-Übersicht

| Schema | Typ | Beschreibung |
|---|---|---|
| `siteSettings` | Singleton | Artist-Name, Hero-Image, Bio, Social Links, Sound |
| `adminSettings` | Singleton | Theme, Animationen, Sections, Labels, Kontakt |
| `legalContent` | Singleton | Impressum + Datenschutz (bilingual) |
| `hudTexts` | Singleton | HUD-Overlay Terminal-Texte |
| `syncLog` | Singleton | Letzte Sync-Zeitstempel |
| `release` | Collection | Musik-Releases mit Streaming-Links |
| `gig` | Collection | Tour-Dates / Events |
| `member` | Collection | Band-Mitglieder |
| `friend` | Collection | Partner & Freunde |
| `newsItem` | Collection | News-Artikel |
| `galleryImage` | Collection | Galerie-Bilder |
| `mediaFile` | Collection | Media-Dateien (Audio, Video, Download) |
| `creditHighlight` | Collection | Kredit-Highlights |
| `terminalCommand` | Collection | Custom Terminal-Befehle |

---

## API-Integrations-Übersicht

| API | Zweck | Auto-Sync | Endpunkt |
|---|---|---|---|
| **iTunes Search** | Releases abrufen | ✅ Täglich | `itunes.apple.com/search` |
| **Bandsintown** | Tour-Dates abrufen | ✅ Täglich | `rest.bandsintown.com` |
| **Odesli / song.link** | Cross-Platform Streaming-Links | ✅ Bei iTunes-Sync | `api.song.link` |
| **wsrv.nl** | Bild-Proxy / Optimierung | ⚡ On-demand | `wsrv.nl` |
| **Sanity CDN** | Content-Daten | ⚡ On-demand (cached) | `unz85dqo.apicdn.sanity.io` |

---

## Fehlerbehebung

### "Sanity not configured" Error
→ Stelle sicher, dass `SANITY_API_TOKEN` in den Vercel Environment Variables gesetzt ist.

### Keine Daten im Frontend
→ Überprüfe die CORS Origins im Sanity Dashboard (Schritt 8).

### iTunes-Sync erstellt keine Releases
→ Der Sync überspringt Releases, die bereits existieren (basierend auf `itunesId`). Prüfe den Sync Log in Sanity Studio.

### Bandsintown-Sync funktioniert nicht
→ Stelle sicher, dass `BANDSINTOWN_API_KEY` in Vercel gesetzt ist.

### Studio zeigt "Unauthorized"
→ Melde dich bei sanity.io an und stelle sicher, dass du dem Projekt zugewiesen bist.

---

## Nächste Schritte

1. **Daten migrieren:** Bestehende Daten aus Upstash Redis nach Sanity exportieren
2. **Frontend umschalten:** `useKV` durch `useSanityQuery` / `loadSiteData()` ersetzen
3. **Redis entfernen:** Öffentliche Content-Reads aus Redis entfernen (nur noch Sessions/Analytics behalten)
4. **Preview-Modus:** Sanity Live Preview für Entwürfe implementieren
