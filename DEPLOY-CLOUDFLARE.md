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

> **Wichtig:** `ADMIN_PASSWORD` ist die maßgebliche Quelle für das Admin-Passwort.
> Beim Login gleicht der Worker den gespeicherten Hash damit ab und aktualisiert
> ihn bei Bedarf — ein nachträglich geändertes Secret wirkt also sofort, ganz ohne
> `DELETE FROM admins;`. Ist gar kein `ADMIN_PASSWORD` gesetzt, wird der Admin
> beim ersten Login mit dem Notfall-Standard `nazumido` angelegt.

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

## Alternative: komplett über das Dashboard (ohne Terminal)

Wer keine Befehle tippen möchte, kann alles im Browser auf
[dash.cloudflare.com](https://dash.cloudflare.com) erledigen. Cloudflare baut den
Worker dann selbst aus dem verbundenen GitHub-Repo („Workers Builds").

> Hinweise: R2 verlangt einmalig eine hinterlegte Zahlungsart (Gratis-Stufe
> kostet nichts). Eine kleine Änderung an `wrangler.toml` (die Database ID) wird
> über die GitHub-Weboberfläche gemacht — ebenfalls ohne Terminal.

**A) D1-Datenbank anlegen**
1. **Storage & Databases → D1 SQL Database → Create Database** → Name `nazumido-db`.
2. Datenbank öffnen → Tab **Console** → Inhalt von `schema.sql` einfügen → **Execute**.
3. Die **Database ID** auf der Übersichtsseite kopieren.

**B) Database ID eintragen (über github.com)**
1. Repo öffnen → Datei `wrangler.toml` → Bearbeiten (Bleistift-Symbol).
2. Platzhalter `HIER-DIE-ID-...` durch die Database ID ersetzen → **Commit changes**.

**C) R2-Bucket anlegen**
1. **R2 Object Storage** → ggf. aktivieren → **Create bucket** → Name `nazumido-uploads`.

**D) Worker aus dem Repo deployen**
1. **Workers & Pages → Create → Workers → Import a repository / Connect to Git**.
2. GitHub verbinden, Repo und Branch wählen. Cloudflare liest `wrangler.toml`
   (Assets, D1, R2) automatisch → **Save and Deploy**.

**E) Geheimnisse setzen**
1. Worker öffnen → **Settings → Variables and Secrets**.
2. Secret `JWT_SECRET` (lange Zufallszeichenkette) und Secret `ADMIN_PASSWORD`
   hinzufügen → oben **Deploy**.

**F) Aufrufen**
- Worker-URL öffnen, `/admin` → Login mit `admin` / `ADMIN_PASSWORD`.

Ab jetzt deployt Cloudflare bei jeder Repo-Änderung automatisch neu.

## Häufige Stolperfallen

- **`/admin` lädt nicht / API 404** → `wrangler.toml`: steht `main = "src/worker.js"`?
  Ohne `main` liefert Cloudflare nur statische Dateien und keine API.
- **`D1_ERROR: no such table`** → Schema vergessen: `npm run cf:db:remote` ausführen.
- **Login schlägt fehl / „Ungültiges Token"** → `JWT_SECRET` nicht als Secret
  gesetzt. Nach dem Setzen erneut `npm run cf:deploy`.
- **Login meldet „JWT_SECRET ist im Worker nicht gesetzt"** → das Secret kommt zur
  Laufzeit nicht an, auch wenn es im Dashboard sichtbar ist. Achtung: Im
  Cloudflare-Dashboard gibt es **zwei** Stellen namens *Variables and Secrets*.
  Maßgeblich für den laufenden Worker sind die **Runtime**-Variablen des Workers
  selbst — nicht die Build-/Deploy-Variablen. Das Secret muss an der Stelle
  liegen, die der Worker zur Laufzeit liest.
- **Foto-Upload-Fehler** → R2-Bucket nicht angelegt oder R2 im Konto nicht aktiviert.
- **Bilder werden nicht angezeigt** → sie liegen jetzt in R2 und werden vom Worker
  unter `/uploads/<key>` ausgeliefert; alte lokale `/uploads`-Dateien existieren dort nicht.
