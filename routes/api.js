// routes/api.js — REST-API-Endpunkte für Nazumido
//
// Öffentliche Endpunkte (Beiträge lesen, Einstellungen lesen, Login) sowie
// geschützte Admin-Endpunkte (Beiträge verwalten, Einstellungen ändern, Fotos
// hochladen). Die Authentifizierung erfolgt per JWT (siehe middleware/auth.js).

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const router = express.Router();
const { run, get, all } = require('../db/init');
const { signToken, requireAuth } = require('../middleware/auth');

// Kleiner Wrapper, damit async-Fehler an den Express-Error-Handler gehen
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// Upload-Konfiguration (Multer) — für POST /api/upload
// ---------------------------------------------------------------------------
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
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
  const err = new Error('Nur Bilddateien (JPEG, PNG, WebP, GIF) sind erlaubt');
  err.status = 400; // Client-Fehler, kein Serverfehler
  cb(err);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_UPLOAD_SIZE } });

// ===========================================================================
// Health / Info
// ===========================================================================
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nazumido-api', time: new Date().toISOString() });
});

// ===========================================================================
// ÖFFENTLICH: Beiträge (nur aktive)
// ===========================================================================

// GET /api/posts — alle aktiven Beiträge (neueste zuerst)
router.get(
  '/posts',
  wrap(async (req, res) => {
    const rows = await all(
      `SELECT * FROM posts WHERE is_active = 1
       ORDER BY created_at DESC, id DESC`
    );
    res.json(rows);
  })
);

// GET /api/posts/:id — einzelner aktiver Beitrag
router.get(
  '/posts/:id',
  wrap(async (req, res) => {
    const row = await get(
      'SELECT * FROM posts WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    res.json(row);
  })
);

// ===========================================================================
// ÖFFENTLICH: Einstellungen
// ===========================================================================

// GET /api/settings — Website-Einstellungen als Objekt { key: value }
router.get(
  '/settings',
  wrap(async (req, res) => {
    const rows = await all('SELECT key, value FROM settings');
    const settings = {};
    for (const { key, value } of rows) settings[key] = value;
    res.json(settings);
  })
);

// ===========================================================================
// AUTH: Login
// ===========================================================================

// POST /api/login — Admin-Anmeldung, liefert bei Erfolg ein JWT
router.post(
  '/login',
  wrap(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'username und password sind erforderlich' });
    }

    const admin = await get('SELECT * FROM admins WHERE username = ?', [username]);

    // Auch bei unbekanntem Nutzer einen Hash-Vergleich durchführen, um
    // Timing-Rückschlüsse auf existierende Benutzernamen zu erschweren.
    const hash = admin ? admin.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const ok = await bcrypt.compare(password, hash);

    if (!admin || !ok) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const token = signToken(admin);
    res.json({
      token,
      admin: { id: admin.id, username: admin.username },
    });
  })
);

// ===========================================================================
// GESCHÜTZT: Beiträge verwalten
// ===========================================================================

// GET /api/admin/posts — alle Beiträge inkl. Entwürfe (neueste zuerst)
// Der öffentliche Endpunkt /api/posts liefert nur aktive Beiträge; das Admin-
// Panel benötigt zusätzlich die als Entwurf gespeicherten (is_active = 0).
router.get(
  '/admin/posts',
  requireAuth,
  wrap(async (req, res) => {
    const rows = await all(
      `SELECT * FROM posts ORDER BY created_at DESC, id DESC`
    );
    res.json(rows);
  })
);

// POST /api/admin/posts — neuen Beitrag erstellen
router.post(
  '/admin/posts',
  requireAuth,
  wrap(async (req, res) => {
    const { title, content, photo_url, is_active } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title ist erforderlich' });
    }
    const result = await run(
      `INSERT INTO posts (title, content, photo_url, is_active)
       VALUES (?, ?, ?, ?)`,
      [
        String(title).trim(),
        content ?? null,
        photo_url ?? null,
        is_active === undefined ? 1 : is_active ? 1 : 0,
      ]
    );
    const created = await get('SELECT * FROM posts WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  })
);

// PUT /api/admin/posts/:id — Beitrag bearbeiten
router.put(
  '/admin/posts/:id',
  requireAuth,
  wrap(async (req, res) => {
    const existing = await get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Beitrag nicht gefunden' });

    const merged = {
      title: req.body.title ?? existing.title,
      content: req.body.content ?? existing.content,
      photo_url: req.body.photo_url ?? existing.photo_url,
      is_active:
        req.body.is_active === undefined
          ? existing.is_active
          : req.body.is_active
          ? 1
          : 0,
    };

    if (!merged.title || !String(merged.title).trim()) {
      return res.status(400).json({ error: 'title darf nicht leer sein' });
    }

    await run(
      `UPDATE posts
         SET title = ?, content = ?, photo_url = ?, is_active = ?,
             updated_at = datetime('now')
       WHERE id = ?`,
      [merged.title, merged.content, merged.photo_url, merged.is_active, req.params.id]
    );
    const updated = await get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json(updated);
  })
);

// DELETE /api/admin/posts/:id — Beitrag löschen
router.delete(
  '/admin/posts/:id',
  requireAuth,
  wrap(async (req, res) => {
    const result = await run('DELETE FROM posts WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    }
    res.json({ deleted: true, id: Number(req.params.id) });
  })
);

// ===========================================================================
// GESCHÜTZT: Einstellungen aktualisieren
// ===========================================================================

// PUT /api/admin/settings — Einstellungen (Teil-Update per Objekt) speichern
router.put(
  '/admin/settings',
  requireAuth,
  wrap(async (req, res) => {
    const body = req.body || {};
    const keys = Object.keys(body);
    if (keys.length === 0) {
      return res
        .status(400)
        .json({ error: 'Es wurden keine Einstellungen übermittelt' });
    }

    for (const key of keys) {
      const value = body[key];
      // Upsert: vorhandenen Schlüssel überschreiben, sonst neu anlegen
      await run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value == null ? null : String(value)]
      );
    }

    const rows = await all('SELECT key, value FROM settings');
    const settings = {};
    for (const { key, value } of rows) settings[key] = value;
    res.json(settings);
  })
);

// ===========================================================================
// GESCHÜTZT: Foto-Upload
// ===========================================================================

// POST /api/upload — einzelnes Foto hochladen (Feldname: "photo")
// Liefert die öffentlich erreichbare URL unter /uploads zurück.
router.post(
  '/upload',
  requireAuth,
  upload.single('photo'),
  wrap(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'Keine Datei empfangen (Feldname "photo")' });
    }
    res.status(201).json({
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    });
  })
);

// ---------------------------------------------------------------------------
// Multer-spezifische Fehler (z. B. Datei zu groß) sauber aufbereiten
// ---------------------------------------------------------------------------
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload-Fehler: ${err.message}` });
  }
  next(err);
});

module.exports = router;
