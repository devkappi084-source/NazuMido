-- schema.sql — Datenbankschema für Nazumido auf Cloudflare D1
--
-- Einmalig einspielen mit:
--   npx wrangler d1 execute nazumido-db --remote --file=./schema.sql   (Produktion)
--   npx wrangler d1 execute nazumido-db --local  --file=./schema.sql   (lokal, wrangler dev)
--
-- Die Seed-INSERTs sind idempotent: Ein erneutes Ausführen fügt keine Duplikate
-- ein. Der Standard-Admin wird NICHT hier angelegt, sondern beim ersten Login
-- automatisch vom Worker (das Passwort muss zur Laufzeit gehasht werden).

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT,
  photo_url  TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Online-Reservierungen (POST /api/reservations). Der Worker legt die Tabelle
-- bei Bedarf auch zur Laufzeit an, damit ein bestehendes D1 ohne Migration
-- weiterläuft.
CREATE TABLE IF NOT EXISTS reservations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL,
  event_id    TEXT,
  event_title TEXT NOT NULL,
  event_date  TEXT,
  event_iso   TEXT,
  event_time  TEXT,
  event_where TEXT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  seats       INTEGER NOT NULL DEFAULT 1,
  note        TEXT,
  ip_hash     TEXT,
  mail_status TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations (event_iso, event_id);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Seed: Beispiel-Beiträge (nur, wenn die Tabelle noch leer ist)
-- ---------------------------------------------------------------------------
INSERT INTO posts (title, content, photo_url)
SELECT
  'Garde brilliert bei der Marktgemeinde-Gala',
  'Mit funkelnden Pailletten und präzisen Hebefiguren eröffnete unsere Garde die diesjährige Faschingssaison. Was für ein Auftakt für die Session 2026!',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM posts);

INSERT INTO posts (title, content, photo_url)
SELECT
  'Saisonauftakt 2026 — Tickets ab sofort erhältlich',
  'Der Vorverkauf für unseren großen Faschingsumzug am 14. Februar startet. Sichert euch eure Plätze unter Tel. 07582 / 81 12 oder direkt im Vereinslokal Gasthof Hofer.',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Saisonauftakt 2026 — Tickets ab sofort erhältlich');

-- ---------------------------------------------------------------------------
-- Seed: Standard-Einstellungen (idempotent über den Primärschlüssel "key")
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('vereinsname',  'Faschingsverein Nazumido'),
  ('beschreibung', 'Der Faschingsverein Nazumido aus Micheldorf, OÖ — seit 1962 im Zeichen von Garde, Guggenmusik und geselligem Vereinsleben.'),
  ('logo_url',     ''),
  ('email',        'info@nazumido.at'),
  ('telefon',      '07582 / 81 12'),
  ('adresse',      'Gasthof Hofer, 4592 Micheldorf, OÖ'),
  ('gegruendet',   '1962');
