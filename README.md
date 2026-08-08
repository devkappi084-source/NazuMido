# Nazumido — Backend & Website

Node.js + Express-Backend mit SQLite-Datenbank für die Website des
Faschingsvereins **Nazumido** (Micheldorf, OÖ, gegründet 1962).

Der Server liefert die öffentliche Website aus, stellt eine REST-API bereit und
enthält ein passwortgeschütztes Admin-Panel zum Verwalten von Beiträgen,
Einstellungen und Foto-Uploads.

---

## 1. Installation

```bash
npm install        # Abhängigkeiten installieren
npm start          # Server starten (node server.js)
```

Der Server läuft anschließend auf **http://localhost:3000**.

Für die Entwicklung mit automatischem Neustart bei Dateiänderungen:

```bash
npm run dev        # node --watch server.js
```

---

## 2. Environment-Variablen (`.env`)

Kopiere die Vorlage und passe die Werte an:

```bash
cp .env.example .env
```

Die wichtigsten Variablen:

| Variable          | Standard                      | Beschreibung |
|-------------------|-------------------------------|--------------|
| `PORT`            | `3000`                        | Port, auf dem der Server lauscht |
| `JWT_SECRET`      | *(generieren!)*               | Geheimer Schlüssel zum Signieren der JWTs |
| `NODE_ENV`        | `development`                 | Node-Umgebung (`development` / `production`) |
| `JWT_EXPIRES_IN`  | `7d`                          | Gültigkeitsdauer der Tokens (z. B. `1h`, `12h`, `7d`) |
| `DB_PATH`         | `./db/nazumido.sqlite`        | Pfad zur SQLite-Datenbankdatei |
| `UPLOAD_DIR`      | `./uploads`                   | Zielordner für hochgeladene Fotos |
| `MAX_UPLOAD_SIZE` | `5242880` (5 MB)              | Maximale Uploadgröße in Bytes |
| `CORS_ORIGINS`    | `http://localhost:3000,…`     | Erlaubte CORS-Ursprünge (kommagetrennt) |
| `ADMIN_USERNAME`  | `admin`                       | Standard-Admin, wird beim ersten Start angelegt |
| `ADMIN_PASSWORD`  | `nazumido`                    | Passwort des Standard-Admins |

### `JWT_SECRET` generieren

In Produktion **muss** `JWT_SECRET` gesetzt sein. Ohne gültigen Wert fällt der
Server auf einen unsicheren Entwicklungs-Standard zurück (mit Warnung im Log).
Einen sicheren Zufallswert erzeugst du z. B. mit:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Den ausgegebenen Wert in die `.env` unter `JWT_SECRET=` eintragen.

---

## 3. Erster Start

Beim ersten `npm start` erledigt `db/init.js` automatisch die Einrichtung:

- Die **SQLite-Datenbank** wird angelegt (Standard: `db/nazumido.sqlite`).
- Die Tabellen `posts`, `settings` und `admins` werden erstellt.
- Beispiel-Beiträge und Standard-Einstellungen werden eingefügt (Seed).
- Ein **Standard-Admin** wird angelegt:

  | Benutzername | Passwort   |
  |--------------|------------|
  | `admin`      | `nazumido` |

  > ⚠️ **Wichtig:** Das Standardpasswort ist nur für die Entwicklung gedacht.
  > Setze für Produktion vor dem ersten Start `ADMIN_USERNAME` und
  > `ADMIN_PASSWORD` in der `.env`, oder ändere die Zugangsdaten unmittelbar
  > nach dem ersten Login.

Die Datenbankdatei und hochgeladene Fotos sind über `.gitignore` von der
Versionsverwaltung ausgeschlossen und werden bei Bedarf lokal neu erzeugt.

---

## 4. Admin-Zugang

1. Login-Seite öffnen: **http://localhost:3000/login.html**
2. Mit den Admin-Zugangsdaten anmelden (`admin` / `nazumido`).
3. Nach erfolgreicher Anmeldung erfolgt die Weiterleitung zum Dashboard unter
   **http://localhost:3000/admin**.

Das Dashboard erlaubt das Erstellen, Bearbeiten und Löschen von Beiträgen, das
Ändern der Website-Einstellungen sowie das Hochladen von Fotos. Der Zugriff auf
die geschützten API-Endpunkte (`/api/admin/*`, `/api/upload`) erfolgt per
`Authorization: Bearer <token>`-Header; das Token wird beim Login ausgestellt.

---

## 5. Öffentliche Website

Die öffentliche Seite ist ohne Anmeldung erreichbar unter:

**http://localhost:3000/**

Sie zeigt die aktiven Beiträge und Vereinsinformationen, die über die
öffentlichen API-Endpunkte geladen werden:

| Endpunkt              | Beschreibung |
|-----------------------|--------------|
| `GET /api/health`     | Status-Check des Servers |
| `GET /api/posts`      | Alle aktiven Beiträge (neueste zuerst) |
| `GET /api/posts/:id`  | Einzelner aktiver Beitrag |
| `GET /api/settings`   | Website-Einstellungen als `{ key: value }` |

---

## 6. Foto-Upload

Uploads laufen über den geschützten Endpunkt `POST /api/upload` (Feldname der
Datei: `photo`) und werden im Admin-Dashboard verwendet.

- **Maximale Größe:** 5 MB pro Datei (über `MAX_UPLOAD_SIZE` anpassbar)
- **Erlaubte Formate:** JPG/JPEG, PNG, WebP, GIF
- **Speicherort:** Dateien werden automatisch in `/uploads` abgelegt und sind
  danach öffentlich unter `http://localhost:3000/uploads/<dateiname>` erreichbar.

Hochgeladene Dateien erhalten einen eindeutigen Namen (Originalname + Zeitstempel),
um Kollisionen zu vermeiden. Zu große oder nicht erlaubte Dateien werden mit
einer aussagekräftigen Fehlermeldung (HTTP 400) abgewiesen.

---

## 7. Dateistruktur — Übersicht

```
NazuMido/
├── server.js              Einstiegspunkt: Express-App, CORS, statische Dateien, Routen
├── package.json           Projekt-Metadaten, Scripts (start/dev), Abhängigkeiten
├── .env.example           Vorlage für die Umgebungsvariablen (→ nach .env kopieren)
│
├── db/
│   ├── init.js            Legt DB & Tabellen an, Seed-Daten, Promise-Helfer (run/get/all)
│   └── nazumido.sqlite    SQLite-Datenbank (wird automatisch erzeugt, nicht im Git)
│
├── routes/
│   └── api.js             REST-API: öffentliche & geschützte Endpunkte, Multer-Upload
│
├── middleware/
│   └── auth.js            JWT: Token signieren (signToken) & Routen absichern (requireAuth)
│
├── public/                Vom Server ausgelieferte statische Dateien
│   ├── index.html         Öffentliche Website
│   ├── login.html         Admin-Login-Seite
│   └── admin/
│       ├── dashboard.html Admin-Dashboard (erreichbar unter /admin)
│       ├── admin.js       Frontend-Logik des Dashboards (API-Aufrufe, Token-Handling)
│       └── admin.css      Styling für Login & Dashboard
│
├── uploads/               Hochgeladene Fotos (Inhalt nicht im Git, .gitkeep bleibt)
├── assets/                Logo & Bildmaterial des Vereins
│
└── wrangler.toml          Konfiguration der früheren statischen Cloudflare-Workers-Variante
```

> Hinweis: Die `*.jsx`-Dateien und `styles.css` im Wurzelverzeichnis stammen aus
> der ursprünglichen, rein statischen Variante der Website (React über CDN). Der
> hier beschriebene Express-Server ist die aktuelle, serverseitige Umsetzung.

---

## 8. Nächste Schritte (Produktion)

1. **Auf echten Server deployen** — z. B. mit [PM2](https://pm2.keymetrics.io/)
   als Prozess-Manager, damit der Server dauerhaft läuft und Neustarts übersteht:

   ```bash
   npm install -g pm2
   pm2 start server.js --name nazumido
   pm2 startup      # Autostart beim Booten einrichten
   pm2 save
   ```

   Vorher in der `.env` unbedingt `NODE_ENV=production` setzen sowie ein sicheres
   `JWT_SECRET` und geänderte Admin-Zugangsdaten hinterlegen.

2. **HTTPS konfigurieren** — den Node-Server hinter einen Reverse-Proxy
   (z. B. **nginx** oder **Caddy**) stellen und TLS-Zertifikate über
   [Let's Encrypt](https://letsencrypt.org/) einrichten. Anschließend
   `CORS_ORIGINS` auf die tatsächliche(n) HTTPS-Domain(s) anpassen.

3. **Custom Domain** — die eigene Domain (z. B. `nazumido.at`) per DNS auf den
   Server zeigen lassen und im Reverse-Proxy als Server-Name eintragen.
