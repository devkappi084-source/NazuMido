// db/init.js — Initialisierung der SQLite-Datenbank für Nazumido
//
// Legt die Datenbankdatei an (falls nicht vorhanden), erstellt die Tabellen
// und befüllt sie beim ersten Start mit ein paar Beispieldaten (Seed).
// Exportiert eine gemeinsam genutzte Datenbankverbindung sowie kleine
// Promise-Helfer (run/get/all), damit die Routen bequem async/await nutzen können.

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Pfad zur DB-Datei aus der Umgebung ableiten (Default: ./db/nazumido.sqlite)
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'nazumido.sqlite');

// Sicherstellen, dass der Zielordner existiert
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Verbindung öffnen
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[db] Verbindung fehlgeschlagen:', err.message);
    process.exit(1);
  }
  console.log(`[db] Verbunden mit SQLite: ${DB_PATH}`);
});

// Fremdschlüssel aktivieren
db.run('PRAGMA foreign_keys = ON;');

// ---------------------------------------------------------------------------
// Promise-Wrapper rund um die callback-basierte sqlite3-API
// ---------------------------------------------------------------------------
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      // `this` enthält lastID und changes
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const SCHEMA = [
  // Neuigkeiten / News
  `CREATE TABLE IF NOT EXISTS news (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     tag        TEXT,
     tag_color  TEXT DEFAULT 'red',
     title      TEXT NOT NULL,
     excerpt    TEXT,
     body       TEXT,
     image      TEXT,
     feature    INTEGER DEFAULT 0,
     created_at TEXT DEFAULT (datetime('now'))
   )`,

  // Veranstaltungen / Events
  `CREATE TABLE IF NOT EXISTS events (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     title      TEXT NOT NULL,
     kind       TEXT,
     description TEXT,
     event_date TEXT,
     event_time TEXT,
     location   TEXT,
     created_at TEXT DEFAULT (datetime('now'))
   )`,

  // Fotos (Metadaten; die Datei liegt im uploads-Ordner)
  `CREATE TABLE IF NOT EXISTS photos (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     title       TEXT,
     grp         TEXT,
     filename    TEXT NOT NULL,
     mimetype    TEXT,
     size        INTEGER,
     uploaded_at TEXT DEFAULT (datetime('now'))
   )`,

  // Admin-Benutzer (einfache Grundlage für spätere Authentifizierung)
  `CREATE TABLE IF NOT EXISTS admins (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     email      TEXT UNIQUE NOT NULL,
     name       TEXT,
     role       TEXT DEFAULT 'Vorstand',
     created_at TEXT DEFAULT (datetime('now'))
   )`,
];

// ---------------------------------------------------------------------------
// Seed-Daten (nur beim ersten Start, wenn die Tabellen leer sind)
// ---------------------------------------------------------------------------
async function seed() {
  const newsCount = await get('SELECT COUNT(*) AS c FROM news');
  if (newsCount.c === 0) {
    const seedNews = [
      {
        tag: 'Rückblick',
        tag_color: 'red',
        title: 'Garde brilliert bei der Marktgemeinde-Gala',
        excerpt:
          'Mit funkelnden Pailletten und präzisen Hebefiguren eröffnete unsere Garde die diesjährige Faschingssaison.',
        body: 'Punkt 14 Uhr schmettern die Trompeten und unsere Garde wirbelt über den Marktplatz. Was für ein Auftakt für die Session 2026!',
        image: 'assets/garde.png',
        feature: 1,
      },
      {
        tag: 'Ankündigung',
        tag_color: 'green',
        title: 'Saisonauftakt 2026 — Tickets ab sofort erhältlich',
        excerpt:
          'Der Vorverkauf für unseren großen Faschingsumzug am 14. Februar startet.',
        body: 'Sichert euch eure Plätze unter Tel. 07582 / 81 12 oder direkt im Vereinslokal Gasthof Hofer.',
        image: null,
        feature: 0,
      },
    ];
    for (const n of seedNews) {
      await run(
        `INSERT INTO news (tag, tag_color, title, excerpt, body, image, feature)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.tag, n.tag_color, n.title, n.excerpt, n.body, n.image, n.feature]
      );
    }
    console.log(`[db] Seed: ${seedNews.length} News eingefügt`);
  }

  const eventCount = await get('SELECT COUNT(*) AS c FROM events');
  if (eventCount.c === 0) {
    const seedEvents = [
      {
        title: 'Großer Faschingsumzug',
        kind: 'Hauptevent · Session 2026',
        description:
          'Über 30 Gruppen, 12 Wagen, eine Stadt im Ausnahmezustand. Start am Hauptplatz.',
        event_date: '2026-02-14',
        event_time: '14:00',
        location: 'Hauptplatz Micheldorf',
      },
      {
        title: 'Prinzenball',
        kind: 'Gala · Eintritt 28 €',
        description:
          'Großer Galaball mit Inthronisation des Prinzenpaars. Liveband, Garde-Show, Mitternachtseinlage.',
        event_date: '2026-02-21',
        event_time: '19:30',
        location: 'Festsaal Micheldorf',
      },
    ];
    for (const e of seedEvents) {
      await run(
        `INSERT INTO events (title, kind, description, event_date, event_time, location)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [e.title, e.kind, e.description, e.event_date, e.event_time, e.location]
      );
    }
    console.log(`[db] Seed: ${seedEvents.length} Events eingefügt`);
  }

  const adminCount = await get('SELECT COUNT(*) AS c FROM admins');
  if (adminCount.c === 0) {
    await run(
      `INSERT INTO admins (email, name, role) VALUES (?, ?, ?)`,
      ['vorstand@nazumido.at', 'Vorstand Nazumido', 'Vorstand']
    );
    console.log('[db] Seed: Standard-Admin eingefügt');
  }
}

// ---------------------------------------------------------------------------
// Öffentliche Initialisierungsfunktion
// ---------------------------------------------------------------------------
async function initDb() {
  // Tabellen der Reihe nach anlegen
  for (const stmt of SCHEMA) {
    await run(stmt);
  }
  console.log('[db] Schema bereit');
  await seed();
  return db;
}

module.exports = { db, initDb, run, get, all, DB_PATH };
