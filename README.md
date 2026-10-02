# Nazumido — Website

Website des Faschingsvereins **Nazumido** (Micheldorf, OÖ, gegründet 1962).
Statische Single-Page-App (React über CDN, kein Build-Schritt) auf
**Cloudflare Pages**, mit einer kleinen Pages Function für Ticket-Reservierungen.

```
public/               Website (wird 1:1 ausgeliefert)
  _routes.json        Pfade, die durch die Pages Function laufen
  _redirects          statische Weiterleitungen
functions/[[path]].js Pages Function → src/worker.js
src/worker.js         API (Hono): Reservierungen + Bestätigungsmail, D1, R2
schema.sql            D1-Schema
test/worker.e2e.mjs   End-to-End-Test (npm test)
wrangler.toml         Pages-Konfiguration
```

```bash
npm install
npm run dev       # lokal: http://localhost:8788
npm run deploy    # auf Cloudflare Pages veröffentlichen
```

Einrichtung im Cloudflare-Dashboard (Git-Integration: Build-Befehl leer,
Ausgabeverzeichnis `public`), D1, Secrets und Mailversand:
siehe [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md).
