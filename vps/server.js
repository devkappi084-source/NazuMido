/* ============================================================
   NazuMido Foto-Server
   Deployed on a rented VPS (e.g., Hetzner CX11)
   Serves event photos with HMAC-signed URL authentication.

   Routes:
     GET  /health                              → status
     GET  /events/:id/files?key=API_KEY        → list filenames
     POST /events/:id/upload (multipart)       → upload (API key)
     GET  /events/:id/:file?expires=&sig=      → download (signed URL)
     DELETE /events/:id/:file                  → delete (API key)
   ============================================================ */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app         = express();
const PORT        = parseInt(process.env.PORT || '3000', 10);
const API_KEY     = process.env.API_KEY;
const HMAC_SECRET = process.env.HMAC_SECRET;
const PHOTOS_DIR  = path.resolve(process.env.PHOTOS_DIR || './photos');

if (!API_KEY)     { console.error('Fehler: API_KEY fehlt in .env'); process.exit(1); }
if (!HMAC_SECRET) { console.error('Fehler: HMAC_SECRET fehlt in .env'); process.exit(1); }

fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// ── Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // CORS — only allow requests from your Cloudflare Pages domain
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.use(express.json());

// ── API-key auth ──────────────────────────────────────────────
function requireKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key || key !== API_KEY) { res.status(401).json({ error: 'Unauthorized' }); return; }
  next();
}

// ── HMAC signed URL verification ─────────────────────────────
function verifySignedUrl(eventId, filename, expires, sig) {
  if (!expires || !sig) return false;
  if (Date.now() > parseInt(expires, 10)) return false;
  const msg      = `${eventId}/${filename}:${expires}`;
  const expected = crypto.createHmac('sha256', HMAC_SECRET).update(msg).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

// ── Safe path helper ──────────────────────────────────────────
function safePath(dir, ...parts) {
  const resolved = path.resolve(dir, ...parts.map(p => path.basename(String(p))));
  if (!resolved.startsWith(path.resolve(dir))) return null; // path traversal guard
  return resolved;
}

// ── Multer storage ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventDir = path.join(PHOTOS_DIR, path.basename(req.params.eventId));
    fs.mkdirSync(eventDir, { recursive: true });
    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.\-_]/g, '')
      || `foto-${Date.now()}.jpg`;
    cb(null, safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 50 },
  fileFilter: (req, file, cb) => {
    cb(null, /\.(jpe?g|png|gif|webp)$/i.test(file.originalname));
  }
});

// ── Routes ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), photos: PHOTOS_DIR });
});

// List files for an event (admin)
app.get('/events/:eventId/files', requireKey, (req, res) => {
  const dir = safePath(PHOTOS_DIR, req.params.eventId);
  if (!dir || !fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f))
    .map(filename => ({
      filename,
      size: fs.statSync(path.join(dir, filename)).size,
      mtime: fs.statSync(path.join(dir, filename)).mtime.toISOString()
    }));
  res.json(files);
});

// Upload photos (admin)
app.post('/events/:eventId/upload', requireKey, upload.array('photos', 50), (req, res) => {
  const uploaded = (req.files || []).map(f => f.filename);
  res.json({ ok: true, uploaded });
});

// Download photo (HMAC-signed URL required)
app.get('/events/:eventId/:filename', (req, res) => {
  const { eventId, filename } = req.params;
  const { expires, sig }      = req.query;

  if (!verifySignedUrl(eventId, filename, expires, sig)) {
    res.status(403).json({ error: 'Ungültige oder abgelaufene URL' });
    return;
  }

  const filePath = safePath(PHOTOS_DIR, eventId, filename);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Foto nicht gefunden' });
    return;
  }

  // Hint download filename
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(filePath);
});

// Delete photo (admin)
app.delete('/events/:eventId/:filename', requireKey, (req, res) => {
  const filePath = safePath(PHOTOS_DIR, req.params.eventId, req.params.filename);
  if (!filePath) { res.status(400).json({ error: 'Ungültiger Pfad' }); return; }
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Nicht gefunden' }); return; }
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NazuMido Foto-Server läuft auf Port ${PORT}`);
  console.log(`Fotos-Verzeichnis: ${PHOTOS_DIR}`);
});
