# Nazumido auf Cloudflare Pages hosten

Die Website läuft komplett auf **Cloudflare Pages** — ohne eigenen Server:

| Aufgabe | Umsetzung |
|---|---|
| Website ausliefern | **Pages** liefert den Ordner `public/` statisch aus |
| REST-API `/api`, Coming-Soon-Modus, `/admin`-Weiterleitung | **Pages Function** `functions/[[path]].js` → Hono-App in `src/worker.js` |
| Welche Pfade durch die Function laufen | `public/_routes.json` |
| Datenbank (Reservierungen) | **D1** (`env.DB`) |
| Foto-Uploads über die API (optional) | **R2** (`env.BUCKET`) |

Es gibt **keinen Build-Schritt** — `public/` wird 1:1 hochgeladen, die Function
bündelt Cloudflare automatisch.

---

## Variante A — über das Dashboard mit GitHub (empfohlen)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages →
   Create → Pages → Connect to Git**.
2. GitHub verbinden, Repo `NazuMido` und den Produktions-Branch wählen.
3. Build-Einstellungen:

   | Feld | Wert |
   |---|---|
   | Framework preset | `None` |
   | Build command | *(leer lassen)* |
   | Build output directory | `public` |
   | Root directory | *(leer lassen)* |

4. **Save and Deploy.** Cloudflare liest die `wrangler.toml` (D1-Binding,
   Variablen) automatisch mit und baut die Function aus `functions/`. Ohne
   Build-Befehl führt Pages kein `npm install` aus — deshalb liegt `hono`
   fertig gebündelt in `src/vendor/hono.js` (neu erzeugen mit
   `npm run vendor`, z. B. nach einem hono-Update).

Danach deployt Cloudflare bei jedem Push automatisch neu; andere Branches
bekommen eigene Vorschau-URLs.

## Variante B — per Terminal

```bash
npm install
npx wrangler login
npx wrangler pages project create nazumido --production-branch main
npm run deploy             # = wrangler pages deploy
```

---

## Schritt 1 — D1-Datenbank

Die `database_id` steht bereits in der `wrangler.toml`. Für eine neue
Datenbank:

```bash
npx wrangler d1 create nazumido-db      # ID in wrangler.toml eintragen
npm run db:remote                       # schema.sql einspielen
```

Ohne Terminal: **Storage & Databases → D1 → Create** → Name `nazumido-db`,
dann im Tab **Console** den Inhalt von `schema.sql` ausführen. Die Tabelle
`reservations` legt die Function bei Bedarf auch selbst an.

## Schritt 2 — R2-Bucket (optional)

Nur nötig, wenn Fotos über `POST /api/upload` hochgeladen werden sollen (die
Website selbst nutzt das derzeit nicht):

```bash
npx wrangler r2 bucket create nazumido-uploads
```

und den `[[r2_buckets]]`-Block in der `wrangler.toml` einkommentieren.

## Schritt 3 — Geheimnisse setzen

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npx wrangler pages secret put JWT_SECRET        # erzeugten Wert einfügen
npx wrangler pages secret put ADMIN_PASSWORD    # Passwort für /api/login
```

Ohne Terminal: Pages-Projekt → **Settings → Variables and Secrets** → als
*Secret* anlegen, danach neu deployen.

`ADMIN_PASSWORD` ist die maßgebliche Quelle für das API-Admin-Passwort; ein
nachträglich geändertes Secret wirkt sofort. Der Benutzername steht als
`ADMIN_USERNAME` in der `wrangler.toml`.

## Schritt 3b — Bestätigungsmails für Ticket-Reservierungen (optional)

Reservierungen von der Website landen über `POST /api/reservations` in D1. Ist
ein Mailanbieter hinterlegt, verschickt die Function sofort zwei Mails: die
Bestätigung an die Besucher:in und eine Kopie an den Verein. Fehlt der Anbieter,
wird nur gespeichert und die Website bietet den mailto-Link an.

Unterstützt werden **Resend**, **Brevo** und **Mailgun**:

```bash
# 1. Anbieter-Schlüssel als Secret (nur einer davon nötig)
npx wrangler pages secret put RESEND_API_KEY
#   oder: BREVO_API_KEY / MAILGUN_API_KEY (+ MAILGUN_DOMAIN, MAILGUN_REGION="eu")

# 2. Absender und Empfänger in wrangler.toml unter [vars] eintragen:
#    MAIL_FROM  = "Faschingsverein Nazumido <tickets@nazu-mido.at>"
#    CLUB_EMAIL = "Nazu.Mido@gmx.at"
```

Die Absenderdomain muss beim Anbieter verifiziert sein (SPF/DKIM). Prüfen:

```bash
curl -s https://<deine-domain>/api/health
curl -s -X POST https://<deine-domain>/api/reservations \
  -H 'Content-Type: application/json' \
  -d '{"eventTitle":"Test","eventDate":"1. Jänner","name":"Test","email":"du@example.at","count":1}'
```

Ein-/ausschalten lässt sich der Versand im Admin-Panel unter
*Einstellungen › Tickets › Bestätigung*.

---

## Coming-Soon-Modus

`COMING_SOON = "true"` in der `wrangler.toml` (oder als Variable im Dashboard)
zeigt Besuchern `public/coming-soon.html`. Das Team öffnet einmal `/?vorschau`
(bzw. `/?vorschau=<PREVIEW_KEY>`) und sieht danach die echte Seite;
`/?vorschau=aus` beendet die Vorschau.

## Eigene Domain

Pages-Projekt → **Custom domains → Set up a custom domain** (z. B.
`www.nazu-mido.at`).

---

## Lokale Entwicklung & Tests

```bash
npm install
npm run db:local          # Schema einmalig ins lokale D1
npm run dev               # = wrangler pages dev  → http://localhost:8788
npm test                  # baut die Function und testet die API mit Miniflare
```

Lokale Secrets: `.dev.vars.example` nach `.dev.vars` kopieren.

## Häufige Stolperfallen

- **API liefert 404 / HTML statt JSON** → Build output directory muss `public`
  sein und der Ordner `functions/` im Repo-Root liegen; `public/_routes.json`
  muss mit hochgeladen werden.
- **`Could not resolve "hono"`** → `src/worker.js` muss aus
  `./vendor/hono.js` importieren, nicht aus dem npm-Paket `hono`.
- **`D1_ERROR: no such table`** → `npm run db:remote` ausführen.
- **„JWT_SECRET ist im Pages-Projekt nicht gesetzt"** → Secret anlegen und neu
  deployen; `/api/health` zeigt unter `bindings`, was ankommt.
- **`wrangler`-Version** ist auf `~4.120.1` gepinnt, weil 4.121.0 ein nicht
  veröffentlichtes miniflare verlangt und der Build sonst beim Installieren
  abbricht.
