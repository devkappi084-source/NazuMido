// db/init.js — Initialisierung der SQLite-Datenbank für Nazumido
//
// Legt die Datenbankdatei an (falls nicht vorhanden), erstellt die Tabellen
// (posts, settings, admins) und befüllt sie beim ersten Start mit Standard-
// werten (Seed). Exportiert eine gemeinsam genutzte Datenbankverbindung sowie
// kleine Promise-Helfer (run/get/all), damit die Routen bequem async/await
// nutzen können.

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
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
  // Beiträge / Posts (Neuigkeiten der Website)
  `CREATE TABLE IF NOT EXISTS posts (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     title      TEXT NOT NULL,
     content    TEXT,
     photo_url  TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now')),
     is_active  INTEGER NOT NULL DEFAULT 1
   )`,

  // Website-Einstellungen als Schlüssel/Wert-Paare
  // (Logo, Beschreibung, Vereinsname, Kontakt, …)
  `CREATE TABLE IF NOT EXISTS settings (
     key   TEXT PRIMARY KEY,
     value TEXT
   )`,

  // Admin-Benutzer für das geschützte Backend
  `CREATE TABLE IF NOT EXISTS admins (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     username      TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     created_at    TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
];

// ---------------------------------------------------------------------------
// Seed-Daten (nur beim ersten Start, wenn die Tabellen leer sind)
// ---------------------------------------------------------------------------
async function seed() {
  // --- Beispiel-Beiträge --------------------------------------------------
  const postCount = await get('SELECT COUNT(*) AS c FROM posts');
  if (postCount.c === 0) {
    const seedPosts = [
      {
        title: 'Garde brilliert bei der Marktgemeinde-Gala',
        content:
          'Mit funkelnden Pailletten und präzisen Hebefiguren eröffnete unsere Garde die diesjährige Faschingssaison. Was für ein Auftakt für die Session 2026!',
        photo_url: '/uploads/garde.png',
      },
      {
        title: 'Saisonauftakt 2026 — Tickets ab sofort erhältlich',
        content:
          'Der Vorverkauf für unseren großen Faschingsumzug am 14. Februar startet. Sichert euch eure Plätze unter Tel. 07582 / 81 12 oder direkt im Vereinslokal Gasthof Hofer.',
        photo_url: null,
      },
    ];
    for (const p of seedPosts) {
      await run(
        `INSERT INTO posts (title, content, photo_url) VALUES (?, ?, ?)`,
        [p.title, p.content, p.photo_url]
      );
    }
    console.log(`[db] Seed: ${seedPosts.length} Beiträge eingefügt`);
  }

  // --- Standard-Einstellungen ---------------------------------------------
  const settingsCount = await get('SELECT COUNT(*) AS c FROM settings');
  if (settingsCount.c === 0) {
    const seedSettings = {
      vereinsname: 'Faschingsverein Nazumido',
      beschreibung:
        'Der Faschingsverein Nazumido aus Micheldorf, OÖ — seit 1962 im Zeichen von Garde, Guggenmusik und geselligem Vereinsleben.',
      logo_url: '/assets/logo.png',
      email: 'info@nazumido.at',
      telefon: '07582 / 81 12',
      adresse: 'Gasthof Hofer, 4592 Micheldorf, OÖ',
      gegruendet: '1962',
    };
    for (const [key, value] of Object.entries(seedSettings)) {
      await run(
        `INSERT INTO settings (key, value) VALUES (?, ?)`,
        [key, value]
      );
    }
    console.log(
      `[db] Seed: ${Object.keys(seedSettings).length} Einstellungen eingefügt`
    );
  }

  // --- Standard-Admin ------------------------------------------------------
  const adminCount = await get('SELECT COUNT(*) AS c FROM admins');
  if (adminCount.c === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'nazumido';
    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO admins (username, password_hash) VALUES (?, ?)`,
      [username, hash]
    );
    console.log(
      `[db] Seed: Standard-Admin "${username}" angelegt` +
        (process.env.ADMIN_PASSWORD
          ? ''
          : ' (Standardpasswort "nazumido" — bitte in Produktion ändern!)')
    );
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
