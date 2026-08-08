// routes/api.js — REST-API-Endpunkte für Nazumido
//
// Stellt CRUD-Endpunkte für News und Events sowie einen Lese-Endpunkt für
// Foto-Metadaten bereit. Der eigentliche Foto-Upload wird in routes/uploads.js
// abgewickelt.

const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/init');

// Kleiner Wrapper, damit async-Fehler an den Express-Error-Handler gehen
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// Health / Info
// ---------------------------------------------------------------------------
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nazumido-api', time: new Date().toISOString() });
});

// ===========================================================================
// NEWS
// ===========================================================================

// Alle News (neueste zuerst)
router.get(
  '/news',
  wrap(async (req, res) => {
    const rows = await all('SELECT * FROM news ORDER BY created_at DESC, id DESC');
    res.json(rows);
  })
);

// Einzelne News
router.get(
  '/news/:id',
  wrap(async (req, res) => {
    const row = await get('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'News nicht gefunden' });
    res.json(row);
  })
);

// News anlegen
router.post(
  '/news',
  wrap(async (req, res) => {
    const { tag, tag_color, title, excerpt, body, image, feature } = req.body;
    if (!title) return res.status(400).json({ error: 'title ist erforderlich' });
    const result = await run(
      `INSERT INTO news (tag, tag_color, title, excerpt, body, image, feature)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tag || null, tag_color || 'red', title, excerpt || null, body || null, image || null, feature ? 1 : 0]
    );
    const created = await get('SELECT * FROM news WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  })
);

// News aktualisieren
router.put(
  '/news/:id',
  wrap(async (req, res) => {
    const existing = await get('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'News nicht gefunden' });

    const merged = {
      tag: req.body.tag ?? existing.tag,
      tag_color: req.body.tag_color ?? existing.tag_color,
      title: req.body.title ?? existing.title,
      excerpt: req.body.excerpt ?? existing.excerpt,
      body: req.body.body ?? existing.body,
      image: req.body.image ?? existing.image,
      feature: req.body.feature != null ? (req.body.feature ? 1 : 0) : existing.feature,
    };

    await run(
      `UPDATE news SET tag = ?, tag_color = ?, title = ?, excerpt = ?, body = ?, image = ?, feature = ?
       WHERE id = ?`,
      [merged.tag, merged.tag_color, merged.title, merged.excerpt, merged.body, merged.image, merged.feature, req.params.id]
    );
    const updated = await get('SELECT * FROM news WHERE id = ?', [req.params.id]);
    res.json(updated);
  })
);

// News löschen
router.delete(
  '/news/:id',
  wrap(async (req, res) => {
    const result = await run('DELETE FROM news WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'News nicht gefunden' });
    res.json({ deleted: true, id: Number(req.params.id) });
  })
);

// ===========================================================================
// EVENTS
// ===========================================================================

router.get(
  '/events',
  wrap(async (req, res) => {
    const rows = await all('SELECT * FROM events ORDER BY event_date ASC, id ASC');
    res.json(rows);
  })
);

router.get(
  '/events/:id',
  wrap(async (req, res) => {
    const row = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Event nicht gefunden' });
    res.json(row);
  })
);

router.post(
  '/events',
  wrap(async (req, res) => {
    const { title, kind, description, event_date, event_time, location } = req.body;
    if (!title) return res.status(400).json({ error: 'title ist erforderlich' });
    const result = await run(
      `INSERT INTO events (title, kind, description, event_date, event_time, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, kind || null, description || null, event_date || null, event_time || null, location || null]
    );
    const created = await get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  })
);

router.put(
  '/events/:id',
  wrap(async (req, res) => {
    const existing = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Event nicht gefunden' });

    const merged = {
      title: req.body.title ?? existing.title,
      kind: req.body.kind ?? existing.kind,
      description: req.body.description ?? existing.description,
      event_date: req.body.event_date ?? existing.event_date,
      event_time: req.body.event_time ?? existing.event_time,
      location: req.body.location ?? existing.location,
    };

    await run(
      `UPDATE events SET title = ?, kind = ?, description = ?, event_date = ?, event_time = ?, location = ?
       WHERE id = ?`,
      [merged.title, merged.kind, merged.description, merged.event_date, merged.event_time, merged.location, req.params.id]
    );
    const updated = await get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(updated);
  })
);

router.delete(
  '/events/:id',
  wrap(async (req, res) => {
    const result = await run('DELETE FROM events WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Event nicht gefunden' });
    res.json({ deleted: true, id: Number(req.params.id) });
  })
);

// ===========================================================================
// PHOTOS (nur Lesen; Upload läuft über /api/uploads)
// ===========================================================================

router.get(
  '/photos',
  wrap(async (req, res) => {
    const rows = await all('SELECT * FROM photos ORDER BY uploaded_at DESC, id DESC');
    // Öffentlich erreichbare URL ergänzen
    const withUrl = rows.map((p) => ({ ...p, url: `/uploads/${p.filename}` }));
    res.json(withUrl);
  })
);

module.exports = router;
