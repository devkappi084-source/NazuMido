# Nazumido auf Cloudflare hosten (Workers + D1 + R2)

Diese Anleitung beschreibt, wie die **komplette** Website inklusive Admin-Panel,
Login und Foto-Uploads auf Cloudflare läuft — ohne separaten Node-Server.

## Architektur

| Aufgabe | Früher (Express) | Jetzt (Cloudflare) |
|---|---|---|
| Website ausliefern | `express.static` | **Workers Static Assets** (`public/`) |
| REST-API `/api` | Express-Router | **Worker** (`src/worker.js`, Hono) |
| Datenbank | lokale `sqlite3`-Datei | **D1** (`env.DB`) |
| Foto-Uploads | `multer` → `/uploads` | **R2** (`env.BUCKET`) |
| Login/JWT | `jsonwebtoken` + `bcryptjs` | Web Crypto (JWT + PBKDF2) |

Das Frontend in `public/` blieb unverändert — es spricht weiterhin `/api` und
`/uploads` auf derselben Domain an.

---

## Voraussetzungen (einmalig)

```bash
npm install                 # Abhängigkeiten inkl. wrangler
npx wrangler login          # Cloudflare-Konto verbinden (öffnet den Browser)
```

---

## Schritt 1 — D1-Datenbank anlegen

```bash
npx wrangler d1 create nazumido-db
```

Der Befehl gibt einen Block wie diesen aus:

```
[[d1_databases]]
binding = "DB"
database_name = "nazumido-db"
database_id = "abcd1234-...."      <-- diese ID kopieren
```

Die **`database_id`** in die `wrangler.toml` eintragen (ersetzt den Platzhalter
`HIER-DIE-ID-AUS-wrangler-d1-create-EINTRAGEN`).

Danach das Schema + die Startdaten in die **Produktions**-Datenbank einspielen:

```bash
npm run cf:db:remote
# entspricht: wrangler d1 execute nazumido-db --remote --file=./schema.sql
```

> Der Standard-Admin wird **nicht** hier angelegt, sondern automatisch beim
> allerersten Login (siehe Schritt 3).

---

## Schritt 2 — R2-Bucket für Fotos anlegen

```bash
npx wrangler r2 bucket create nazumido-uploads
```

Der Name `nazumido-uploads` steht bereits in der `wrangler.toml`. R2 erfordert
in deinem Cloudflare-Konto eine einmalige (kostenlose) Aktivierung im Dashboard.

---

## Schritt 3 — Geheimnisse setzen

Diese Werte gehören **nicht** in Dateien, sondern verschlüsselt zu Cloudflare:

```bash
# Signierschlüssel für die JWTs — langen Zufallswert erzeugen:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npx wrangler secret put JWT_SECRET
#   -> den erzeugten Wert einfügen

# Passwort des Standard-Admins (wird beim ersten Login angelegt):
npx wrangler secret put ADMIN_PASSWORD
#   -> Wunschpasswort eingeben
```

Der Benutzername steht als nicht-geheime Variable `ADMIN_USERNAME` in der
`wrangler.toml` (Standard: `admin`).

> **Wichtig:** `ADMIN_PASSWORD` wirkt nur beim allerersten Login, wenn noch kein
> Admin in der D1-Datenbank existiert. Möchtest du das Passwort später ändern,
> lösche den Datensatz in D1 (`DELETE FROM admins;`) — beim nächsten Login wird
> der Admin mit dem aktuellen `ADMIN_PASSWORD` neu angelegt.

---

## Schritt 4 — Deployen

```bash
npm run cf:deploy          # = wrangler deploy
```

Wrangler nennt dir am Ende die URL, z. B.
`https://nazumido2.<dein-subdomain>.workers.dev`.

| Pfad | Inhalt |
|---|---|
| `/` | Öffentliche Startseite |
| `/login.html` | Admin-Login |
| `/admin` | Admin-Dashboard |
| `/api/health` | API-Statuscheck |

---

## Eigene Domain (optional)

Im Cloudflare-Dashboard unter **Workers & Pages → nazumido2 → Settings →
Domains & Routes** eine eigene Domain (z. B. `www.nazumido.at`) verbinden.
Voraussetzung: Die Domain wird über Cloudflare verwaltet (Nameserver).

---

## Lokale Entwicklung

```bash
npm run cf:db:local        # Schema einmalig ins lokale D1 einspielen
npm run cf:dev             # = wrangler dev  (lokaler Worker mit D1 + R2)
```

Ohne gesetzte Secrets nutzt der Worker lokal die Standardwerte
(`admin` / `nazumido`). Für echte lokale Secrets eine Datei `.dev.vars` anlegen:

```
JWT_SECRET=lokaler-testschluessel
ADMIN_PASSWORD=nazumido
```

---

## Tests

Ein vollständiger End-to-End-Test (echtes D1 + R2 über Miniflare, prüft Login,
Beiträge-CRUD, Einstellungen und Foto-Upload) liegt unter `test/worker.e2e.mjs`:

```bash
npm run cf:test
```

---

## Häufige Stolperfallen

- **`/admin` lädt nicht / API 404** → `wrangler.toml`: steht `main = "src/worker.js"`?
  Ohne `main` liefert Cloudflare nur statische Dateien und keine API.
- **`D1_ERROR: no such table`** → Schema vergessen: `npm run cf:db:remote` ausführen.
- **Login schlägt fehl / „Ungültiges Token"** → `JWT_SECRET` nicht als Secret
  gesetzt. Nach dem Setzen erneut `npm run cf:deploy`.
- **Foto-Upload-Fehler** → R2-Bucket nicht angelegt oder R2 im Konto nicht aktiviert.
- **Bilder werden nicht angezeigt** → sie liegen jetzt in R2 und werden vom Worker
  unter `/uploads/<key>` ausgeliefert; alte lokale `/uploads`-Dateien existieren dort nicht.
