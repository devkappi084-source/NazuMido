# Nazumido — Website

Öffentliche Website des Faschingsvereins **Nazumido** (Micheldorf, OÖ,
gegründet 1962). Eine rein statische Seite: kein Server, keine Datenbank,
kein Build-Schritt.

## Ansehen

Alles, was der Browser braucht, liegt in `public/`. Zum Ausprobieren genügt ein
beliebiger statischer Webserver:

```bash
cd public
python3 -m http.server 8080      # → http://localhost:8080
```

Die Seite direkt per Doppelklick zu öffnen (`file://`) funktioniert nicht —
die Browser blockieren dabei das Nachladen der `.jsx`-Dateien.

## Veröffentlichen

Den Ordner `public/` auf das Hosting kopieren, fertig. Geeignet ist alles, was
statische Dateien ausliefert:

- **Cloudflare Pages** — Repo verbinden, Build-Command leer lassen,
  Output-Verzeichnis `public`.
- **Netlify / GitHub Pages / Vercel** — analog.
- **Klassischer Webspace** — Inhalt von `public/` per FTP ins Web-Root.

Eigene Domain: einen `CNAME`-Eintrag auf die Adresse des Hosters setzen
(z. B. `www` → `nazumido.pages.dev`). Für die nackte Domain ohne `www`
zusätzlich eine Weiterleitung auf `www` einrichten.

Die Seite lädt React und Babel von einem CDN und die Schriften von Google
Fonts. Besucher:innen brauchen also Internetzugang — was auf einer
öffentlichen Website ohnehin gegeben ist.

## Inhalte pflegen

Zwei Wege:

**1. Admin-Panel** (`#admin`, Standardpasswort `admin2026`, änderbar unter
*Einstellungen › Zugang*). Dort lassen sich Termine, Neuigkeiten, Fotos,
Personen, Gruppen, Sponsoren und die Vereinsinfos bearbeiten. Die Änderungen
werden im `localStorage` des Browsers gespeichert — sie sind sofort sichtbar,
aber **nur auf dem Gerät, auf dem sie gemacht wurden**. Für Besucher:innen
ändert sich dadurch nichts.

**2. `public/data.jsx` bearbeiten.** Diese Datei ist die Quelle aller Inhalte.
Was hier steht, sehen alle. Änderungen committen und neu veröffentlichen.

Das Admin-Panel eignet sich also zum Ausprobieren und Vorbereiten, `data.jsx`
für den echten Stand der Website.

## Aufbau

```
public/
  index.html / Nazumido.html   Einstiegspunkt (identisch)
  styles.css                   sämtliches CSS
  data.jsx                     alle Inhalte — hier wird redigiert
  components.jsx               gemeinsame Bausteine
  pages-detail.jsx             Unterseiten
  admin.jsx                    Admin-Panel (#admin)
  app.jsx                      Wurzelkomponente und Routing
  assets/                      Wappen, Fotos
```

Details zur Architektur stehen in `CLAUDE.md`.
