// routes/uploads.js — Foto-Upload-Handler für Nazumido
//
// Nutzt Multer, um Bilder im uploads-Ordner zu speichern, und legt für jede
// Datei einen Metadaten-Eintrag in der photos-Tabelle an.

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { run, get, all } = require('../db/init');

// Zielordner (identisch zu server.js, aus der Umgebung ableitbar)
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 5 * 1024 * 1024; // 5 MB

// Erlaubte Bildtypen
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// ---------------------------------------------------------------------------
// Multer-Konfiguration
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Eindeutiger, kollisionsfreier Dateiname
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base || 'foto'}-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new Error('Nur Bilddateien (JPEG, PNG, WebP, GIF) sind erlaubt'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_SIZE },
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// POST /api/uploads — einzelnes Foto hochladen (Feldname: "photo")
// ---------------------------------------------------------------------------
router.post(
  '/',
  upload.single('photo'),
  wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Keine Datei empfangen (Feldname "photo")' });

    const { title, group } = req.body;
    const result = await run(
      `INSERT INTO photos (title, grp, filename, mimetype, size)
       VALUES (?, ?, ?, ?, ?)`,
      [title || null, group || null, req.file.filename, req.file.mimetype, req.file.size]
    );
    const photo = await get('SELECT * FROM photos WHERE id = ?', [result.lastID]);
    res.status(201).json({ ...photo, url: `/uploads/${photo.filename}` });
  })
);

// ---------------------------------------------------------------------------
// DELETE /api/uploads/:id — Foto samt Datei löschen
// ---------------------------------------------------------------------------
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const photo = await get('SELECT * FROM photos WHERE id = ?', [req.params.id]);
    if (!photo) return res.status(404).json({ error: 'Foto nicht gefunden' });

    // Datei vom Datenträger entfernen (Fehler ignorieren, falls schon weg)
    const filePath = path.join(UPLOAD_DIR, photo.filename);
    fs.promises.unlink(filePath).catch(() => {});

    await run('DELETE FROM photos WHERE id = ?', [req.params.id]);
    res.json({ deleted: true, id: Number(req.params.id) });
  })
);

// ---------------------------------------------------------------------------
// Fehlerbehandlung speziell für Multer (z. B. Datei zu groß)
// ---------------------------------------------------------------------------
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload-Fehler: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
