// server.js — Einstiegspunkt des Nazumido Express-Servers
//
// Startet den HTTP-Server, initialisiert die SQLite-Datenbank, stellt statische
// Dateien aus /public und Fotos aus /uploads bereit und bindet die REST-API-
// sowie die Upload-Routen ein.

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { initDb } = require('./db/init');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------------------
// Ordner sicherstellen: /uploads wird bei Start erstellt, falls nicht vorhanden
// ---------------------------------------------------------------------------
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------------------------------------------------------------------------
// CORS – aktiviert für localhost (konfigurierbar über CORS_ORIGINS)
// ---------------------------------------------------------------------------
const corsOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://localhost:8787,http://127.0.0.1:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Anfragen ohne Origin (z. B. curl, Server-zu-Server) zulassen
      if (!origin) return cb(null, true);
      // Jeder localhost/127.0.0.1-Ursprung ist erlaubt, plus explizite Liste
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost || corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: Ursprung ${origin} ist nicht erlaubt`));
    },
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body-Parser
// ---------------------------------------------------------------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Statische Dateien
// ---------------------------------------------------------------------------
app.use(express.static(PUBLIC_DIR));               // öffentliche Website
app.use('/uploads', express.static(UPLOAD_DIR));   // hochgeladene Fotos

// ---------------------------------------------------------------------------
// Routen
// ---------------------------------------------------------------------------
app.use('/api', apiRoutes);
app.use('/api/uploads', uploadRoutes);

// Admin-Panel bequem unter /admin erreichbar
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'dashboard.html'));
});

// ---------------------------------------------------------------------------
// 404 für unbekannte API-Routen
// ---------------------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpunkt nicht gefunden' });
});

// ---------------------------------------------------------------------------
// Zentrale Fehlerbehandlung
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Fehler:', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Interner Serverfehler' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`\n🎭 Nazumido-Server läuft auf http://localhost:${PORT}`);
      console.log(`   • Website:    http://localhost:${PORT}/`);
      console.log(`   • Admin:      http://localhost:${PORT}/admin`);
      console.log(`   • API:        http://localhost:${PORT}/api/health`);
      console.log(`   • Uploads:    ${UPLOAD_DIR}\n`);
    });
  } catch (err) {
    console.error('[server] Start fehlgeschlagen:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
